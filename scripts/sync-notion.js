#!/usr/bin/env node

/**
 * ============================================================================
 * Notion to Portfolio Static Sync Engine (Universal Node.js 12+ Compatible)
 * Jebin Joseph J. - Enterprise IT Infrastructure Portfolio
 * ============================================================================
 * 
 * Fetches articles and engineering notes from a Notion Database via the official
 * Notion API (v2022-06-28) and compiles them into `assets/data/articles.json`.
 * 
 * Compatibility:
 *   - Compatible with Node.js v12.x, v14.x, v16.x, v18.x, v20.x, v22.x
 *   - Pure native built-ins: fs, path, crypto, https, http, url, child_process
 *   - Zero optional chaining (?.) so it runs on legacy Node environments
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// --- Universal fetch polyfill for Node.js < 18 ---
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = function (input, init) {
    init = init || {};
    return new Promise(function (resolve, reject) {
      try {
        const parsedUrl = new URL(input);
        const isHttps = parsedUrl.protocol === 'https:';
        const transport = isHttps ? https : http;

        const headers = Object.assign({}, init.headers || {});
        const method = (init.method || 'GET').toUpperCase();

        let bodyData = null;
        if (init.body) {
          if (typeof init.body === 'string') {
            bodyData = Buffer.from(init.body);
          } else if (Buffer.isBuffer(init.body)) {
            bodyData = init.body;
          } else {
            bodyData = Buffer.from(String(init.body));
          }
          if (!headers['Content-Length'] && !headers['content-length']) {
            headers['Content-Length'] = bodyData.length;
          }
        }

        const reqOptions = {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: method,
          headers: headers
        };

        const req = transport.request(reqOptions, function (res) {
          // Handle HTTP redirects (301, 302, 307, 308)
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const nextUrl = new URL(res.headers.location, parsedUrl).href;
            return resolve(globalThis.fetch(nextUrl, init));
          }

          const chunks = [];
          res.on('data', function (chunk) { chunks.push(chunk); });
          res.on('end', function () {
            const buffer = Buffer.concat(chunks);
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              statusText: res.statusMessage || '',
              headers: res.headers,
              text: async function () { return buffer.toString('utf8'); },
              json: async function () { return JSON.parse(buffer.toString('utf8')); },
              arrayBuffer: async function () {
                return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
              }
            });
          });
        });

        req.on('error', reject);
        if (bodyData) {
          req.write(bodyData);
        }
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  };
}

// Auto-load .env file if available (custom cross-version parser)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(function (line) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const k = match[1].trim();
          const v = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    });
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
async function downloadAndCacheImage(imageUrl, prefix) {
  prefix = prefix || 'img';
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
      const { execSync } = require('child_process');
      let compressed = false;
      // 1. macOS native: sips
      try {
        execSync(`sips -Z 1200 -s format jpeg -s formatOptions 85 "${localFilePath}" --out "${optimizedJpgLocal}"`, { stdio: 'ignore' });
        compressed = true;
      } catch (errMac) {
        // 2. Linux native: ffmpeg
        try {
          execSync(`ffmpeg -y -v error -i "${localFilePath}" -vf "scale='min(1200,iw)':-1" -q:v 3 "${optimizedJpgLocal}"`, { stdio: 'ignore' });
          compressed = true;
        } catch (errFfmpeg) {
          // 3. Linux native: ImageMagick convert
          try {
            execSync(`convert "${localFilePath}" -resize "1200x>" -quality 85 "${optimizedJpgLocal}"`, { stdio: 'ignore' });
            compressed = true;
          } catch (errConvert) {
            compressed = false;
          }
        }
      }

      if (compressed && fs.existsSync(optimizedJpgLocal) && fs.statSync(optimizedJpgLocal).size > 0) {
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
      // Optimizer not available or failed; keep original downloaded file
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
async function notionRequest(endpoint, options) {
  options = options || {};
  const url = `https://api.notion.com/v1/${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: Object.assign({
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    }, options.headers || {}),
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
async function resolveNotionTargets(forceAutoDetect) {
  forceAutoDetect = Boolean(forceAutoDetect);
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
    let dbTitle = 'Articles Database';
    if (selectedDb.title && Array.isArray(selectedDb.title) && selectedDb.title.length > 0) {
      dbTitle = selectedDb.title.map(function (t) { return t.plain_text; }).join('').trim() || 'Articles Database';
    }
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
function renderRichText(richTextArray) {
  richTextArray = richTextArray || [];
  if (!Array.isArray(richTextArray)) return '';

  return richTextArray.map(function (item) {
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
    blocks.push.apply(blocks, data.results || []);
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return blocks;
}

/**
 * Converts an array of Notion blocks into clean semantic HTML
 */
async function convertBlocksToHtml(blocks, articleSlug) {
  articleSlug = articleSlug || 'article';
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
        const text = renderRichText(block.paragraph ? block.paragraph.rich_text : null);
        if (text) {
          htmlParts.push(`<p>${text}</p>`);
        }
        break;
      }
      case 'heading_1': {
        const text = renderRichText(block.heading_1 ? block.heading_1.rich_text : null);
        htmlParts.push(`<h3>${text}</h3>`);
        break;
      }
      case 'heading_2': {
        const text = renderRichText(block.heading_2 ? block.heading_2.rich_text : null);
        htmlParts.push(`<h3>${text}</h3>`);
        break;
      }
      case 'heading_3': {
        const text = renderRichText(block.heading_3 ? block.heading_3.rich_text : null);
        htmlParts.push(`<h4>${text}</h4>`);
        break;
      }
      case 'bulleted_list_item': {
        if (!inBulletedList) {
          htmlParts.push('<ul>');
          inBulletedList = true;
        }
        const text = renderRichText(block.bulleted_list_item ? block.bulleted_list_item.rich_text : null);
        htmlParts.push(`<li>${text}</li>`);
        break;
      }
      case 'numbered_list_item': {
        if (!inNumberedList) {
          htmlParts.push('<ol>');
          inNumberedList = true;
        }
        const text = renderRichText(block.numbered_list_item ? block.numbered_list_item.rich_text : null);
        htmlParts.push(`<li>${text}</li>`);
        break;
      }
      case 'callout': {
        const text = renderRichText(block.callout ? block.callout.rich_text : null);
        htmlParts.push(`<div class="article-callout">${text}</div>`);
        break;
      }
      case 'quote': {
        const text = renderRichText(block.quote ? block.quote.rich_text : null);
        htmlParts.push(`<blockquote>${text}</blockquote>`);
        break;
      }
      case 'code': {
        const codeObj = block.code || {};
        const text = renderRichText(codeObj.rich_text);
        const language = codeObj.language || 'text';
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
        const imgObj = block.image || {};
        const extUrl = (imgObj.external && imgObj.external.url) || '';
        const fileUrl = (imgObj.file && imgObj.file.url) || '';
        const rawImageUrl = extUrl || fileUrl || '';
        const caption = renderRichText(imgObj.caption);
        if (rawImageUrl) {
          const localImageUrl = await downloadAndCacheImage(rawImageUrl, `${articleSlug}-img-${i}`);
          htmlParts.push(`
            <figure class="article-image">
              <img src="${escapeHtml(localImageUrl)}" alt="${escapeHtml(caption || 'Technical illustration')}" loading="lazy" decoding="async">
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
      filter: {
        property: 'Published',
        checkbox: {
          equals: true
        }
      },
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
      if (err.message.indexOf('404') !== -1 || err.message.indexOf('object_not_found') !== -1) {
        console.warn(`\x1b[33m[WARN]\x1b[0m Could not access database ID "${target.id}" (Notion 404 Not Found).`);
        console.warn(`       Reason: The database itself is not shared with integration or ID is a view ID.`);
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
        // If sorting or filtering failed (e.g. property name differs), try basic query
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
      for (let n = 0; n < names.length; n++) {
        const name = names[n];
        if (props[name]) return props[name];
      }
      return null;
    }

    // Title
    const titleProp = getProp(['Title', 'Name', 'Article Title', 'Project name']);
    let title = '';
    if (titleProp && titleProp.title && titleProp.title.length > 0) {
      title = titleProp.title.map(function (t) { return t.plain_text; }).join('').trim();
    }
    if (!title && page.properties) {
      // Look for any property of type title
      const propKeys = Object.keys(page.properties);
      for (let k = 0; k < propKeys.length; k++) {
        const propKey = propKeys[k];
        const p = page.properties[propKey];
        if (p && p.type === 'title' && p.title && p.title.length > 0) {
          title = p.title.map(function (t) { return t.plain_text; }).join('').trim();
          break;
        }
      }
    }
    if (!title) title = 'Engineering Insight';

    // 1. Published Checkbox Verification (Draft Filtering)
    // Only upload/sync articles where the 'Published' checkbox is ticked (true).
    const publishedProp = getProp(['Published', 'Publish', 'Is Published', 'Live']);
    if (publishedProp) {
      if (publishedProp.type === 'checkbox' && !publishedProp.checkbox) {
        console.log(` -> \x1b[33m[SKIPPED DRAFT]\x1b[0m "${title}" (Published checkbox is unchecked in Notion)`);
        continue;
      }
      if (publishedProp.type === 'status' && publishedProp.status && publishedProp.status.name && publishedProp.status.name.toLowerCase() !== 'published') {
        console.log(` -> \x1b[33m[SKIPPED DRAFT]\x1b[0m "${title}" (Status is ${publishedProp.status.name})`);
        continue;
      }
      if (publishedProp.type === 'select' && publishedProp.select && publishedProp.select.name && publishedProp.select.name.toLowerCase() !== 'published') {
        console.log(` -> \x1b[33m[SKIPPED DRAFT]\x1b[0m "${title}" (Status is ${publishedProp.select.name})`);
        continue;
      }
    }

    // Standard auto-generated slug based on article title
    const slug = `article-${slugify(title)}`;

    // Category
    const categoryProp = getProp(['Category', 'Topic', 'Domain', 'Stage']);
    let category = 'Engineering Insight';
    if (categoryProp && categoryProp.select && categoryProp.select.name) {
      category = categoryProp.select.name;
    } else if (categoryProp && categoryProp.multi_select && categoryProp.multi_select[0] && categoryProp.multi_select[0].name) {
      category = categoryProp.multi_select[0].name;
    }

    // Date (Formatted as 'Nov 2026')
    const dateProp = getProp(['Date', 'Published Date', 'Publish Date', 'Timeline']);
    let dateStr = '';
    const dateOptions = { month: 'short', year: 'numeric' };
    if (dateProp && dateProp.date && dateProp.date.start) {
      const d = new Date(dateProp.date.start);
      dateStr = d.toLocaleDateString('en-US', dateOptions);
    } else if (page.last_edited_time || page.created_time) {
      const d = new Date(page.last_edited_time || page.created_time);
      dateStr = d.toLocaleDateString('en-US', dateOptions);
    }

    // Cover Image (from page.cover or Cover property)
    let coverImage = '';
    if (page.cover && page.cover.external && page.cover.external.url) {
      coverImage = page.cover.external.url;
    } else if (page.cover && page.cover.file && page.cover.file.url) {
      coverImage = page.cover.file.url;
    } else {
      const coverProp = getProp(['Cover', 'Cover Image', 'Image', 'Banner']);
      if (coverProp && coverProp.files && coverProp.files.length > 0) {
        const firstFile = coverProp.files[0];
        coverImage = (firstFile.external && firstFile.external.url) || (firstFile.file && firstFile.file.url) || '';
      }
    }

    // Cache cover image locally to eliminate network buffering
    if (coverImage) {
      coverImage = await downloadAndCacheImage(coverImage, `${slug}-cover`);
    }

    // Tags
    const tagsProp = getProp(['Tags', 'Skills', 'Keywords']);
    let tags = [];
    if (tagsProp && tagsProp.multi_select) {
      tags = tagsProp.multi_select.map(function (item) { return item.name; });
    }

    // LinkedIn URL
    const linkedinProp = getProp(['LinkedInUrl', 'LinkedIn', 'LinkedIn URL', 'Url']);
    let linkedinUrl = 'https://www.linkedin.com/in/jebinjosephj';
    if (linkedinProp && linkedinProp.url) {
      linkedinUrl = linkedinProp.url;
    }

    console.log(` -> Fetching content blocks for: "${title}" (${slug})...`);
    const blocks = await fetchPageBlocks(page.id);
    const contentHtml = await convertBlocksToHtml(blocks, slug);

    const allText = blocks.map(function (b) {
      const blkData = b[b.type];
      if (blkData && blkData.rich_text && Array.isArray(blkData.rich_text)) {
        return blkData.rich_text.map(function (t) { return t.plain_text; }).join('');
      }
      return '';
    }).join(' ').trim();
    const words = allText.split(/\s+/).filter(Boolean).length;

    // Content & summary fallback for drafts
    let finalContent = contentHtml;
    if (!finalContent || words < 5) {
      finalContent = '\n        <p>This technical article is actively being authored in Notion and synced live to your portfolio.</p>\n        <div class="article-callout">\n          <strong>Live Notion Sync:</strong> You can draft paragraphs, architecture diagrams, callouts, and code blocks directly in your Notion workspace. They will automatically sync here!\n        </div>\n      ';
    }

    // Summary (from property or derived from first block)
    const summaryProp = getProp(['Summary', 'Description', 'Excerpt']);
    let summary = '';
    if (summaryProp && summaryProp.rich_text && summaryProp.rich_text.length > 0) {
      summary = summaryProp.rich_text.map(function (t) { return t.plain_text; }).join('').trim();
    }
    if (!summary) {
      // Find first paragraph block
      const firstPara = blocks.find(function (b) {
        return b.type === 'paragraph' && b.paragraph && b.paragraph.rich_text && b.paragraph.rich_text.length > 0;
      });
      if (firstPara && firstPara.paragraph && firstPara.paragraph.rich_text) {
        summary = firstPara.paragraph.rich_text.map(function (t) { return t.plain_text; }).join('').trim().slice(0, 180) + '...';
      } else {
        summary = 'Technical architecture and systems engineering analysis synced live from Notion.';
      }
    }

    // Read Time (from property or calculated by word count)
    const readTimeProp = getProp(['ReadTime', 'Read Time', 'Reading Time']);
    let readTime = '';
    if (readTimeProp && readTimeProp.rich_text && readTimeProp.rich_text.length > 0) {
      readTime = readTimeProp.rich_text.map(function (t) { return t.plain_text; }).join('').trim();
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
  const finalArticles = [].concat(articles);

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
      const gridRegex = /(<div class="articles-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/;
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
          cardsHtml = finalArticles.map(function (art) {
            return `
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
                ${(art.tags || []).map(function (t) { return `<span class="article-tag">${escapeHtml(t)}</span>`; }).join('\n                ')}
              </div>
              <div class="article-footer">
                <span class="article-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(art.date)}</span>
                <button class="btn-read-article js-open-article" data-article-id="${escapeHtml(art.id)}">
                  <span>Read Insight</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </article>`;
          }).join('\n');
        }

        indexHtml = indexHtml.replace(gridRegex, `$1\n${cardsHtml}\n        </div>\n\n      </div>\n    </section>`);
        fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
        console.log(`\x1b[32m[UPDATED]\x1b[0m Pre-rendered Notion articles updated directly in index.html!`);
      }
    } catch (e) {
      console.warn(`[WARN] Could not update index.html cards:`, e.message);
    }
  }
}

syncNotionArticles().catch(function (err) {
  console.error('\n\x1b[31m[FAILED]\x1b[0m', err.message);
  process.exit(1);
});
