#!/usr/bin/env node
/**
 * update-posts.mjs — Notion CMS → posts.json (with full content)
 * ─────────────────────────────────────────────────
 * Notion 데이터베이스에서 발행된 포스트를 가져와
 * public/posts.json 으로 저장합니다.
 * 각 포스트의 전체 블록 콘텐츠를 HTML로 변환하여 포함합니다.
 *
 * 환경변수:
 *   NOTION_TOKEN       — Notion Internal Integration 시크릿
 *   NOTION_DATABASE_ID — Notion 데이터베이스 ID
 *
 * Run: node scripts/update-posts.mjs
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../public/posts.json");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = "2022-06-28";
const MAX_POSTS = 50; // Fetch all published posts for in-site blog

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ═══════════════════════════════════════════════
// Notion API — Database Query
// ═══════════════════════════════════════════════

async function queryNotionDatabase() {
  const allPages = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = {
      filter: {
        property: "상태",
        select: { equals: "발행됨" },
      },
      sorts: [
        { property: "작성일", direction: "descending" },
      ],
      page_size: 100,
    };
    if (cursor) body.start_cursor = cursor;

    const resp = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Notion API error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    allPages.push(...data.results);
    hasMore = data.has_more && allPages.length < MAX_POSTS;
    cursor = data.next_cursor;
  }

  return allPages;
}

// ═══════════════════════════════════════════════
// Notion API — Fetch Page Blocks (Full Content)
// ═══════════════════════════════════════════════

async function fetchPageBlocks(pageId) {
  const blocks = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
    const resp = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
      },
    });

    if (!resp.ok) {
      console.warn(`    ⚠️ Failed to fetch blocks for ${pageId}: ${resp.status}`);
      break;
    }

    const data = await resp.json();
    blocks.push(...data.results);
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  return blocks;
}

// ═══════════════════════════════════════════════
// Notion Blocks → HTML Converter
// ═══════════════════════════════════════════════

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function richTextToHtml(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return "";
  return richTextArray.map(t => {
    let text = escapeHtml(t.plain_text || "");
    if (!text) return "";
    if (t.annotations?.bold) text = `<strong>${text}</strong>`;
    if (t.annotations?.italic) text = `<em>${text}</em>`;
    if (t.annotations?.code) text = `<code>${text}</code>`;
    if (t.annotations?.strikethrough) text = `<del>${text}</del>`;
    if (t.href) text = `<a href="${escapeHtml(t.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    return text;
  }).join("");
}

function blocksToHtml(blocks) {
  const htmlParts = [];
  let inBulletList = false;
  let inNumberedList = false;

  for (const block of blocks) {
    // Close lists if current block is not a list item
    if (block.type !== "bulleted_list_item" && inBulletList) {
      htmlParts.push("</ul>");
      inBulletList = false;
    }
    if (block.type !== "numbered_list_item" && inNumberedList) {
      htmlParts.push("</ol>");
      inNumberedList = false;
    }

    switch (block.type) {
      case "heading_1":
        htmlParts.push(`<h1>${richTextToHtml(block.heading_1?.rich_text)}</h1>`);
        break;
      case "heading_2":
        htmlParts.push(`<h2>${richTextToHtml(block.heading_2?.rich_text)}</h2>`);
        break;
      case "heading_3":
        htmlParts.push(`<h3>${richTextToHtml(block.heading_3?.rich_text)}</h3>`);
        break;
      case "paragraph": {
        const content = richTextToHtml(block.paragraph?.rich_text);
        if (content) htmlParts.push(`<p>${content}</p>`);
        break;
      }
      case "bulleted_list_item": {
        if (!inBulletList) {
          htmlParts.push("<ul>");
          inBulletList = true;
        }
        htmlParts.push(`<li>${richTextToHtml(block.bulleted_list_item?.rich_text)}</li>`);
        break;
      }
      case "numbered_list_item": {
        if (!inNumberedList) {
          htmlParts.push("<ol>");
          inNumberedList = true;
        }
        htmlParts.push(`<li>${richTextToHtml(block.numbered_list_item?.rich_text)}</li>`);
        break;
      }
      case "quote":
        htmlParts.push(`<blockquote>${richTextToHtml(block.quote?.rich_text)}</blockquote>`);
        break;
      case "callout":
        htmlParts.push(`<div class="callout">${richTextToHtml(block.callout?.rich_text)}</div>`);
        break;
      case "divider":
        htmlParts.push("<hr/>");
        break;
      case "code":
        htmlParts.push(`<pre><code>${richTextToHtml(block.code?.rich_text)}</code></pre>`);
        break;
      case "toggle":
        htmlParts.push(`<details><summary>${richTextToHtml(block.toggle?.rich_text)}</summary></details>`);
        break;
      default:
        // Skip unsupported block types (image, video, embed, etc.)
        break;
    }
  }

  // Close any open lists
  if (inBulletList) htmlParts.push("</ul>");
  if (inNumberedList) htmlParts.push("</ol>");

  return htmlParts.join("\n");
}

// ═══════════════════════════════════════════════
// Parse Notion page properties + content
// ═══════════════════════════════════════════════

function extractPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return "";
  return richTextArray.map(t => t.plain_text || "").join("");
}

async function parsePage(page) {
  const props = page.properties;

  const title = extractPlainText(props.Name?.title || []);
  const summary = extractPlainText(props["메타 설명"]?.rich_text || []);
  const category = props["카테고리"]?.select?.name || "";
  const slug = extractPlainText(props["URL 슬러그"]?.rich_text || []);
  const date = props["작성일"]?.date?.start || "";
  const notionUrl = page.url || "";

  // Fetch full page content
  let contentHtml = "";
  try {
    const blocks = await fetchPageBlocks(page.id);
    contentHtml = blocksToHtml(blocks);
  } catch (err) {
    console.warn(`    ⚠️ Failed to fetch content for "${title}": ${err.message}`);
  }

  return {
    id: page.id,
    slug: slug || page.id,
    title,
    summary,
    category,
    date,
    notionUrl,
    contentHtml,
  };
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Notion Posts Updater (with content)");
  console.log("═══════════════════════════════════════");

  // 환경변수 확인
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.warn("⚠️  NOTION_TOKEN or NOTION_DATABASE_ID not set. Skipping posts update.");
    if (!existsSync(OUT_PATH)) {
      writeFileSync(OUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), posts: [] }, null, 2));
      console.log("📄 Created empty posts.json");
    }
    return;
  }

  console.log(`📡 Querying Notion database: ${NOTION_DATABASE_ID.slice(0, 8)}...`);

  try {
    const pages = await queryNotionDatabase();
    console.log(`📝 Found ${pages.length} published post(s)`);

    // Parse pages with content (sequential to avoid rate limits)
    const posts = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      console.log(`  📄 [${i + 1}/${pages.length}] Fetching content...`);
      const post = await parsePage(page);
      if (post.title) posts.push(post);

      // Rate limit: Notion API allows ~3 requests/sec
      if (i < pages.length - 1) await sleep(400);
    }

    const output = {
      updatedAt: new Date().toISOString(),
      posts,
    };

    writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
    console.log(`\n✅ Saved ${posts.length} post(s) with content → public/posts.json`);

    // Stats
    const withContent = posts.filter(p => p.contentHtml).length;
    const totalChars = posts.reduce((sum, p) => sum + (p.contentHtml?.length || 0), 0);
    console.log(`📊 ${withContent}/${posts.length} posts with content (${Math.round(totalChars / 1024)}KB total HTML)`);

  } catch (err) {
    console.error("❌ Failed to fetch posts from Notion:", err.message);

    if (!existsSync(OUT_PATH)) {
      writeFileSync(OUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), posts: [] }, null, 2));
      console.log("📄 Created empty posts.json (fallback)");
    } else {
      console.log("📄 Keeping existing posts.json");
    }
  }
}

main();
