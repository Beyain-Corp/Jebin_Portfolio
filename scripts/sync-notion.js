#!/usr/bin/env node

/**
 * ============================================================================
 * Notion to Portfolio Static Sync Engine
 * Jebin Joseph J. - Enterprise IT Infrastructure Portfolio
 * ============================================================================
 * 
 * Fetches articles and engineering notes from a Notion Database via the official
 * Notion API (v2022-06-28) and compiles them into `assets/data/articles.json`.
 * 
 * Requirements:
 *   - Node.js 18+ (uses native global fetch)
 *   - Environment Variables:
 *       NOTION_API_KEY      (Internal Integration Secret, e.g. secret_xxxx)
 *       NOTION_DATABASE_ID  (32-character Notion Database ID)
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Auto-load .env file if available
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {
    // ignore
  }
}

let NOTION_API_KEY = process.env.NOTION_API_KEY;
let NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = '2022-06-28';
const OUTPUT_FILE = path.resolve(__dirname, '../assets/data/articles.json');
const IMAGES_DIR = path.resolve(__dirname, '../assets/img/notion');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Downloads and caches Notion/AWS S3 images locally to eliminate buffer time,
 * provide instant rendering, and avoid signed URL expiration (403 errors).
 */
async function downloadAndCacheImage(imageUrl, prefix = 'img') {
  if (!imageUrl || typeof imageUrl !== 'string') return '';
  // If already a local path, don't re-download
  if (imageUrl.startsWith('assets/img/') || imageUrl.startsWith('/assets/img/')) {
    return imageUrl;
  }
  // Only process http / https URLs
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  try {
    const cleanUrl = imageUrl.split('?')[0];
    let ext = path.extname(cleanUrl).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) {
      ext = '.png';
    }
    const hash = crypto.createHash('md5').update(cleanUrl).digest('hex').slice(0, 10);
    const safePrefix = slugify(prefix).slice(0, 30);
    const filename = `${safePrefix}-${hash}${ext}`;
    const localFilePath = path.join(IMAGES_DIR, filename);
    const relativeWebPath = `assets/img/notion/${filename}`;

    const optimizedJpgLocal = localFilePath.replace(/\.[a-z0-9]+$/i, '.jpg');
    const optimizedJpgRelative = relativeWebPath.replace(/\.[a-z0-9]+$/i, '.jpg');

    // If optimized file already exists and is non-empty, use local cache immediately
    if (fs.existsSync(optimizedJpgLocal) && fs.statSync(optimizedJpgLocal).size > 0) {
      return optimizedJpgRelative;
    }
    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 0) {
      return relativeWebPath;
    }

    console.log(`    \x1b[36m[OPTIMIZING IMAGE]\x1b[0m Downloading for instant local delivery: ${filename}...`);
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`    \x1b[33m[WARN]\x1b[0m Could not download image (${res.status}), falling back to direct URL.`);
      return imageUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(localFilePath, Buffer.from(arrayBuffer));

    // Automatically optimize large images (resize to 1200px max & compress) to eliminate web buffering
    try {
      const { execSync } = require('node:child_process');
      execSync(`sips -Z 1200 -s format jpeg -s formatOptions 85 "${localFilePath}" --out "${optimizedJpgLocal}"`, { stdio: 'ignore' });
      if (fs.existsSync(optimizedJpgLocal) && fs.statSync(optimizedJpgLocal).size > 0) {
        if (fs.statSync(optimizedJpgLocal).size < fs.statSync(localFilePath).size) {
          fs.unlinkSync(localFilePath);
          const kb = Math.round(fs.statSync(optimizedJpgLocal).size / 1024);
          console.log(`    \x1b[32m[CACHED & COMPRESSED]\x1b[0m Saved to ${optimizedJpgRelative} (${kb} KB)`);
          return optimizedJpgRelative;
        } else {
          fs.unlinkSync(optimizedJpgLocal);
        }
      }
    } catch (e) {
      // sips not available or failed; keep original downloaded file
    }

    console.log(`    \x1b[32m[CACHED]\x1b[0m Saved to ${relativeWebPath}`);
    return relativeWebPath;
  } catch (err) {
    console.warn(`    \x1b[33m[WARN]\x1b[0m Failed to cache image: ${err.message}. Using original URL.`);
    return imageUrl;
  }
}

// Check credentials
if (!NOTION_API_KEY) {
  console.error('\x1b[31m[ERROR] Missing NOTION_API_KEY.\x1b[0m');
  console.error('Please provide NOTION_API_KEY in .env or as an environment variable.');
  console.error('\nUsage:');
  console.error('  NOTION_API_KEY="ntn_xxx" NOTION_DATABASE_ID="xxx" node scripts/sync-notion.js\n');
  console.error('Refer to blogs/NOTION_SETUP.md for full step-by-step instructions.');
  process.exit(1);
}

// Clean database ID (strip dashes if passed as 36-char UUID or full URL)
function cleanDatabaseId(id) {
  if (!id) return '';
  const match = id.match(/[a-f0-9]{32}/i);
  return match ? match[0] : id.replace(/-/g, '');
}

/**
 * Helper to make authenticated Notion API requests
 */
async function notionRequest(endpoint, options = {}) {
  const url = `https://api.notion.com/v1/${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API request failed [${response.status} ${response.statusText}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Auto-detect database or shared pages if NOTION_DATABASE_ID is not provided or invalid
 */
async function resolveNotionTargets(forceAutoDetect = false) {
  if (!forceAutoDetect && NOTION_DATABASE_ID) {
    const cleaned = cleanDatabaseId(NOTION_DATABASE_ID);
    return { type: 'database', id: cleaned };
  }

  console.log('\x1b[36m[INFO]\x1b[0m Searching for databases or pages shared with Notion integration...');
  
  // 1. Try finding databases first
  const dbSearch = await notionRequest('search', {
    method: 'POST',
    body: {
      filter: { value: 'database', property: 'object' }
    }
  });

  const databases = dbSearch.results || [];
  if (databases.length > 0) {
    const selectedDb = databases[0];
    const dbTitle = selectedDb.title?.map(t => t.plain_text).join('') || 'Articles Database';
    const dbId = cleanDatabaseId(selectedDb.id);
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Found Notion Database: "${dbTitle}" (ID: ${dbId})`);
    return { type: 'database', id: dbId, title: dbTitle };
  }

  // 2. If no database found, search for standalone shared pages
  const pageSearch = await notionRequest('search', {
    method: 'POST',
    body: {}
  });

  const pages = pageSearch.results || [];
  if (pages.length > 0) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Found ${pages.length} individual shared Notion page(s).`);
    return { type: 'pages', pages: pages };
  }

  throw new Error(
    'No databases or pages found shared with this integration.\n' +
    'Please open your database/page in Notion, click the "Share" or "•••" menu at the top-right, go to "Connect to", and select your integration.\n' +
    'Alternatively, copy the Database URL/ID and set NOTION_DATABASE_ID.'
  );
}

/**
 * Converts Notion rich_text array to styled HTML string
 */
function renderRichText(richTextArray = []) {
  if (!Array.isArray(richTextArray)) return '';

  return richTextArray.map(item => {
    let text = escapeHtml(item.plain_text || '');

    if (item.annotations) {
      if (item.annotations.bold) text = `<strong>${text}</strong>`;
      if (item.annotations.italic) text = `<em>${text}</em>`;
      if (item.annotations.strikethrough) text = `<del>${text}</del>`;
      if (item.annotations.underline) text = `<u>${text}</u>`;
      if (item.annotations.code) text = `<code>${text}</code>`;
    }

    if (item.href) {
      text = `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }

    return text;
  }).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Fetches all child blocks for a given Notion page ID
 */
async function fetchPageBlocks(pageId) {
  const blocks = [];
  let cursor = undefined;

  while (true) {
    const query = cursor ? `?page_size=100&start_cursor=${cursor}` : '?page_size=100';
    const data = await notionRequest(`blocks/${pageId}/children${query}`);
    blocks.push(...(data.results || []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return blocks;
}

/**
 * Converts an array of Notion blocks into clean semantic HTML
 */
async function convertBlocksToHtml(blocks, articleSlug = 'article') {
  const htmlParts = [];
  let inBulletedList = false;
  let inNumberedList = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const type = block.type;

    // Handle closing lists if next block is not of same list type
    if (inBulletedList && type !== 'bulleted_list_item') {
      htmlParts.push('</ul>');
      inBulletedList = false;
    }
    if (inNumberedList && type !== 'numbered_list_item') {
      htmlParts.push('</ol>');
      inNumberedList = false;
    }

    switch (type) {
      case 'paragraph': {
        const text = renderRichText(block.paragraph?.rich_text);
        if (text) {
          htmlParts.push(`<p>${text}</p>`);
        }
        break;
      }
      case 'heading_1': {
        const text = renderRichText(block.heading_1?.rich_text);
        htmlParts.push(`<h3>${text}</h3>`);
        break;
      }
      case 'heading_2': {
        const text = renderRichText(block.heading_2?.rich_text);
        htmlParts.push(`<h3>${text}</h3>`);
        break;
      }
      case 'heading_3': {
        const text = renderRichText(block.heading_3?.rich_text);
        htmlParts.push(`<h4>${text}</h4>`);
        break;
      }
      case 'bulleted_list_item': {
        if (!inBulletedList) {
          htmlParts.push('<ul>');
          inBulletedList = true;
        }
        const text = renderRichText(block.bulleted_list_item?.rich_text);
        htmlParts.push(`<li>${text}</li>`);
        break;
      }
      case 'numbered_list_item': {
        if (!inNumberedList) {
          htmlParts.push('<ol>');
          inNumberedList = true;
        }
        const text = renderRichText(block.numbered_list_item?.rich_text);
        htmlParts.push(`<li>${text}</li>`);
        break;
      }
      case 'callout': {
        const text = renderRichText(block.callout?.rich_text);
        htmlParts.push(`<div class="article-callout">${text}</div>`);
        break;
      }
      case 'quote': {
        const text = renderRichText(block.quote?.rich_text);
        htmlParts.push(`<blockquote>${text}</blockquote>`);
        break;
      }
      case 'code': {
        const text = renderRichText(block.code?.rich_text);
        const language = block.code?.language || 'text';
        htmlParts.push(`
          <div class="article-code-block">
            <div class="article-code-header">
              <span class="article-code-lang"><i class="fa-solid fa-code"></i> ${escapeHtml(language)}</span>
              <button class="btn-copy-code" type="button" onclick="navigator.clipboard.writeText(this.closest('.article-code-block').querySelector('code').innerText).then(()=>{this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Copied!';setTimeout(()=>{this.innerHTML='<i class=\\'fa-regular fa-copy\\'></i> Copy'},2000)})">
                <i class="fa-regular fa-copy"></i> Copy
              </button>
            </div>
            <pre><code class="language-${escapeHtml(language)}">${text}</code></pre>
          </div>
        `);
        break;
      }
      case 'image': {
        const rawImageUrl = block.image?.external?.url || block.image?.file?.url || '';
        const caption = renderRichText(block.image?.caption);
        if (rawImageUrl) {
          const localImageUrl = await downloadAndCacheImage(rawImageUrl, `${articleSlug}-img-${i}`);
          htmlParts.push(`
            <figure class="article-image-figure">
              <img src="${escapeHtml(localImageUrl)}" alt="${escapeHtml(caption || 'Architecture Diagram')}" loading="lazy" decoding="async">
              ${caption ? `<figcaption>${caption}</figcaption>` : ''}
            </figure>
          `);
        }
        break;
      }
      case 'divider': {
        htmlParts.push('<hr>');
        break;
      }
      default:
        // Silently skip unhandled block types
        break;
    }
  }

  // Close any remaining open lists
  if (inBulletedList) htmlParts.push('</ul>');
  if (inNumberedList) htmlParts.push('</ol>');

  return htmlParts.join('\n');
}

/**
 * Main Sync Process
 */
async function syncNotionArticles() {
  const target = await resolveNotionTargets();
  let pages = [];

  if (target.type === 'database') {
    console.log(`\x1b[36m[INFO]\x1b[0m Querying Notion Database (${target.id})...`);
    const queryBody = {
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    };

    let responseData = null;
    try {
      responseData = await notionRequest(`databases/${target.id}/query`, {
        method: 'POST',
        body: queryBody
      });
      pages = responseData.results || [];
    } catch (err) {
      if (err.message.includes('404') || err.message.includes('object_not_found')) {
        console.warn(`\x1b[33m[WARN]\x1b[0m Could not access database ID "${target.id}" (Notion 404 Not Found).`);
        console.warn(`       Reason: The database itself is not shared with integration "Jebin's Portfoilo" or ID is a view ID.`);
        console.log(`\x1b[36m[INFO]\x1b[0m Falling back to auto-discovering all shared pages & databases...`);

        const fallbackTarget = await resolveNotionTargets(true);
        if (fallbackTarget.type === 'database') {
          const fallbackData = await notionRequest(`databases/${fallbackTarget.id}/query`, {
            method: 'POST',
            body: {}
          });
          pages = fallbackData.results || [];
        } else {
          pages = fallbackTarget.pages || [];
        }
      } else {
        // If sorting by "Date" failed because property name differs, try without sorts
        try {
          responseData = await notionRequest(`databases/${target.id}/query`, {
            method: 'POST',
            body: {}
          });
          pages = responseData.results || [];
        } catch (retryErr) {
          throw retryErr;
        }
      }
    }
  } else {
    pages = target.pages || [];
  }

  console.log(`\x1b[32m[SUCCESS]\x1b[0m Processing ${pages.length} Notion page(s)...`);

  const articles = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const props = page.properties || {};

    // Helper to find property value regardless of slight naming differences
    function getProp(names) {
      for (const name of names) {
        if (props[name]) return props[name];
      }
      return null;
    }

    // Title
    const titleProp = getProp(['Title', 'Name', 'Article Title', 'Project name']);
    let title = '';
    if (titleProp?.title && titleProp.title.length > 0) {
      title = titleProp.title.map(t => t.plain_text).join('').trim();
    }
    if (!title && page.properties) {
      // Look for any property of type title
      for (const key of Object.keys(page.properties)) {
        if (page.properties[key]?.type === 'title') {
          title = page.properties[key].title?.map(t => t.plain_text).join('').trim();
          break;
        }
      }
    }
    if (!title) title = 'Engineering Insight';

    // Standard auto-generated slug based on article title
    const slug = `article-${slugify(title)}`;

    // Category
    const categoryProp = getProp(['Category', 'Topic', 'Domain', 'Stage']);
    let category = 'Engineering Insight';
    if (categoryProp?.select?.name) {
      category = categoryProp.select.name;
    } else if (categoryProp?.multi_select?.[0]?.name) {
      category = categoryProp.multi_select[0].name;
    }

    // Date (Formatted as 'Nov 2026')
    const dateProp = getProp(['Date', 'Published Date', 'Publish Date', 'Timeline']);
    let dateStr = '';
    const dateOptions = { month: 'short', year: 'numeric' };
    if (dateProp?.date?.start) {
      const d = new Date(dateProp.date.start);
      dateStr = d.toLocaleDateString('en-US', dateOptions);
    } else if (page.last_edited_time || page.created_time) {
      const d = new Date(page.last_edited_time || page.created_time);
      dateStr = d.toLocaleDateString('en-US', dateOptions);
    }

    // Cover Image (from page.cover or Cover property)
    let coverImage = '';
    if (page.cover?.external?.url) {
      coverImage = page.cover.external.url;
    } else if (page.cover?.file?.url) {
      coverImage = page.cover.file.url;
    } else {
      const coverProp = getProp(['Cover', 'Cover Image', 'Image', 'Banner']);
      if (coverProp?.files && coverProp.files.length > 0) {
        coverImage = coverProp.files[0].external?.url || coverProp.files[0].file?.url || '';
      }
    }

    // Cache cover image locally to eliminate network buffering
    if (coverImage) {
      coverImage = await downloadAndCacheImage(coverImage, `${slug}-cover`);
    }

    // Tags
    const tagsProp = getProp(['Tags', 'Skills', 'Keywords']);
    let tags = [];
    if (tagsProp?.multi_select) {
      tags = tagsProp.multi_select.map(item => item.name);
    }

    // LinkedIn URL
    const linkedinProp = getProp(['LinkedInUrl', 'LinkedIn', 'LinkedIn URL', 'Url']);
    let linkedinUrl = 'https://www.linkedin.com/in/jebinjosephj';
    if (linkedinProp?.url) {
      linkedinUrl = linkedinProp.url;
    }

    console.log(` -> Fetching content blocks for: "${title}" (${slug})...`);
    const blocks = await fetchPageBlocks(page.id);
    const contentHtml = await convertBlocksToHtml(blocks, slug);

    const allText = blocks.map(b => b[b.type]?.rich_text?.map(t => t.plain_text).join('') || '').join(' ').trim();
    const words = allText.split(/\s+/).filter(Boolean).length;

    // Content & summary fallback for drafts
    let finalContent = contentHtml;
    if (!finalContent || words < 5) {
      finalContent = `
        <p>This technical article is actively being authored in Notion and synced live to your portfolio.</p>
        <div class="article-callout">
          <strong>Live Notion Sync:</strong> You can draft paragraphs, architecture diagrams, callouts, and code blocks directly in your Notion workspace. They will automatically sync here!
        </div>
      `;
    }

    // Summary (from property or derived from first block)
    const summaryProp = getProp(['Summary', 'Description', 'Excerpt']);
    let summary = '';
    if (summaryProp?.rich_text && summaryProp.rich_text.length > 0) {
      summary = summaryProp.rich_text.map(t => t.plain_text).join('').trim();
    }
    if (!summary) {
      // Find first paragraph block
      const firstPara = blocks.find(b => b.type === 'paragraph' && b.paragraph?.rich_text?.length > 0);
      if (firstPara) {
        summary = firstPara.paragraph.rich_text.map(t => t.plain_text).join('').trim().slice(0, 180) + '...';
      } else {
        summary = 'Technical architecture and systems engineering analysis synced live from Notion.';
      }
    }

    // Read Time (from property or calculated by word count)
    const readTimeProp = getProp(['ReadTime', 'Read Time', 'Reading Time']);
    let readTime = '';
    if (readTimeProp?.rich_text && readTimeProp.rich_text.length > 0) {
      readTime = readTimeProp.rich_text.map(t => t.plain_text).join('').trim();
    }
    if (!readTime) {
      readTime = `${Math.max(1, Math.ceil(Math.max(words, 150) / 200))} min read`;
    }

    articles.push({
      id: slug,
      title: title,
      category: category,
      readTime: readTime,
      date: dateStr,
      summary: summary,
      tags: tags.length ? tags : [category],
      coverImage: coverImage,
      linkedinUrl: linkedinUrl,
      content: finalContent
    });
  }

  // User requirement: Show ONLY Notion contents (no static/foundational fallbacks)
  const finalArticles = [...articles];

  // Ensure directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalArticles, null, 2), 'utf8');
  console.log(`\n\x1b[32m[DONE]\x1b[0m Successfully synced articles! Total Notion articles: ${finalArticles.length}.`);
  console.log(`Saved to: ${OUTPUT_FILE}`);

  // Also update index.html pre-rendered cards so changes are visible immediately
  const indexHtmlPath = path.resolve(__dirname, '../index.html');
  if (fs.existsSync(indexHtmlPath)) {
    try {
      let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      const gridRegex = /(<div class="articles-grid">)([\s\S]*?)(<\/div>\s*<!-- Write & Publish on LinkedIn Banner -->)/;
      if (gridRegex.test(indexHtml)) {
        let cardsHtml = '';
        if (finalArticles.length === 0) {
          cardsHtml = `
          <div class="empty-notion-state" style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
            <i class="fa-solid fa-feather-pointed" style="font-size: 2.2rem; color: var(--accent-cyan); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">No Notion Articles Published Yet</h3>
            <p style="font-size: 0.92rem; color: var(--text-muted); max-width: 500px; margin: 0 auto;">Articles and technical notes published in your Notion workspace will automatically sync here.</p>
          </div>`;
        } else {
          cardsHtml = finalArticles.map(art => `
          <!-- Article: ${escapeHtml(art.title)} -->
          <article class="article-card" data-category="${escapeHtml(art.category)}">
            ${art.coverImage ? `
            <div class="article-card-cover">
              <img src="${escapeHtml(art.coverImage)}" alt="${escapeHtml(art.title)}" loading="lazy" decoding="async">
            </div>` : ''}
            <div class="article-card-inner">
              <div class="article-badge-row">
                <span class="article-category">${escapeHtml(art.category)}</span>
                <span class="article-read-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(art.readTime)}</span>
              </div>
              <h3 class="article-title">
                ${escapeHtml(art.title)}
              </h3>
              <p class="article-summary">
                ${escapeHtml(art.summary || '')}
              </p>
              <div class="article-tags">
                ${(art.tags || []).map(t => `<span class="article-tag">${escapeHtml(t)}</span>`).join('\n                ')}
              </div>
              <div class="article-footer">
                <span class="article-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(art.date)}</span>
                <button class="btn-read-article js-open-article" data-article-id="${escapeHtml(art.id)}">
                  <span>Read Insight</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </article>`).join('\n');
        }

        indexHtml = indexHtml.replace(gridRegex, `$1\n${cardsHtml}\n        </div>\n\n        <!-- Write & Publish on LinkedIn Banner -->`);
        fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
        console.log(`\x1b[32m[UPDATED]\x1b[0m Pre-rendered Notion articles updated directly in index.html!`);
      }
    } catch (e) {
      console.warn(`[WARN] Could not update index.html cards:`, e.message);
    }
  }
}

syncNotionArticles().catch(err => {
  console.error('\n\x1b[31m[FAILED]\x1b[0m', err.message);
  process.exit(1);
});

