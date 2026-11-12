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
function convertBlocksToHtml(blocks) {
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
        const language = block.code?.language || '';
        htmlParts.push(`<pre><code class="language-${escapeHtml(language)}">${text}</code></pre>`);
        break;
      }
      case 'divider': {
        htmlParts.push('<hr>');
        break;
      }
      default:
        // Silently skip unhandled block types (images, bookmarks, etc.) or support text if available
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

    // Check if published (if Published checkbox exists)
    const publishedProp = getProp(['Published', 'Publish', 'Status']);
    if (publishedProp) {
      if (publishedProp.type === 'checkbox' && publishedProp.checkbox === false) {
        continue; // skip unpublished
      }
      if (publishedProp.type === 'select' && publishedProp.select?.name?.toLowerCase() === 'draft') {
        continue;
      }
      if (publishedProp.type === 'status' && publishedProp.status?.name?.toLowerCase() === 'draft') {
        continue;
      }
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

    // Slug / ID
    const slugProp = getProp(['Slug', 'ID', 'Id']);
    let slug = '';
    if (slugProp?.rich_text && slugProp.rich_text.length > 0) {
      slug = slugProp.rich_text.map(t => t.plain_text).join('').trim();
    }
    if (!slug) {
      slug = `article-${slugify(title)}`;
    }

    // Category
    const categoryProp = getProp(['Category', 'Topic', 'Domain', 'Stage']);
    let category = 'Engineering Insight';
    if (categoryProp?.select?.name) {
      category = categoryProp.select.name;
    } else if (categoryProp?.multi_select?.[0]?.name) {
      category = categoryProp.multi_select[0].name;
    }

    // Date
    const dateProp = getProp(['Date', 'Published Date', 'Publish Date', 'Timeline']);
    let dateStr = '';
    if (dateProp?.date?.start) {
      const d = new Date(dateProp.date.start);
      dateStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (page.last_edited_time || page.created_time) {
      const d = new Date(page.last_edited_time || page.created_time);
      dateStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
    const contentHtml = convertBlocksToHtml(blocks);

    const allText = blocks.map(b => b[b.type]?.rich_text?.map(t => t.plain_text).join('') || '').join(' ').trim();
    const words = allText.split(/\s+/).filter(Boolean).length;

    // Check if published or has sufficient content
    const isExplicitlyPublished = (publishedProp?.type === 'checkbox' && publishedProp?.checkbox === true) ||
                                  (publishedProp?.type === 'status' && publishedProp?.status?.name?.toLowerCase() === 'published') ||
                                  (publishedProp?.type === 'select' && publishedProp?.select?.name?.toLowerCase() === 'published');

    if (!isExplicitlyPublished && words < 10) {
      console.log(`    \x1b[33m[SKIP]\x1b[0m Skipping empty draft: "${title}" (${words} words). Add text or check "Published" in Notion to publish.`);
      continue;
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
        summary = 'Technical infrastructure analysis and engineering insights.';
      }
    }

    // Read Time (from property or calculated by word count)
    const readTimeProp = getProp(['ReadTime', 'Read Time', 'Reading Time']);
    let readTime = '';
    if (readTimeProp?.rich_text && readTimeProp.rich_text.length > 0) {
      readTime = readTimeProp.rich_text.map(t => t.plain_text).join('').trim();
    }
    if (!readTime) {
      readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
    }

    articles.push({
      id: slug,
      title: title,
      category: category,
      readTime: readTime,
      date: dateStr,
      summary: summary,
      tags: tags.length ? tags : [category],
      linkedinUrl: linkedinUrl,
      content: contentHtml || `<p>Article content being drafted in Notion.</p>`
    });
  }

  // Load foundational articles as base
  const foundationalFile = path.resolve(__dirname, '../assets/data/foundational-articles.json');
  let combinedArticles = [];
  if (fs.existsSync(foundationalFile)) {
    try {
      combinedArticles = JSON.parse(fs.readFileSync(foundationalFile, 'utf8'));
    } catch (e) {
      combinedArticles = [];
    }
  }

  // Merge Notion articles into foundational base
  for (const nArt of articles) {
    const existingIdx = combinedArticles.findIndex(a => a.id === nArt.id);
    if (existingIdx >= 0) {
      combinedArticles[existingIdx] = nArt;
    } else {
      combinedArticles.push(nArt);
    }
  }

  // Ensure directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combinedArticles, null, 2), 'utf8');
  console.log(`\n\x1b[32m[DONE]\x1b[0m Successfully synced articles! Total published articles: ${combinedArticles.length} (${articles.length} from Notion, ${combinedArticles.length - articles.length} foundational).`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

syncNotionArticles().catch(err => {
  console.error('\n\x1b[31m[FAILED]\x1b[0m', err.message);
  process.exit(1);
});

