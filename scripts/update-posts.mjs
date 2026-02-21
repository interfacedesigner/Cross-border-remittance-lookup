#!/usr/bin/env node
/**
 * update-posts.mjs — Notion CMS → posts.json
 * ─────────────────────────────────────────────────
 * Notion 데이터베이스에서 발행된 포스트를 가져와
 * public/posts.json 으로 저장합니다.
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
const MAX_POSTS = 5;

// ═══════════════════════════════════════════════
// Notion API
// ═══════════════════════════════════════════════

async function queryNotionDatabase() {
  const url = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        property: "상태",
        select: { equals: "발행됨" },
      },
      sorts: [
        { property: "작성일", direction: "descending" },
      ],
      page_size: MAX_POSTS,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Notion API error ${resp.status}: ${body}`);
  }

  return resp.json();
}

// ═══════════════════════════════════════════════
// Parse Notion page properties
// ═══════════════════════════════════════════════

function extractPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return "";
  return richTextArray.map(t => t.plain_text || "").join("");
}

function parsePage(page) {
  const props = page.properties;

  // Title (Name)
  const title = extractPlainText(props.Name?.title || []);

  // Summary (메타 설명)
  const summary = extractPlainText(props["메타 설명"]?.rich_text || []);

  // Category (카테고리)
  const category = props["카테고리"]?.select?.name || "";

  // Slug (URL 슬러그)
  const slug = extractPlainText(props["URL 슬러그"]?.rich_text || []);

  // Date (작성일)
  const date = props["작성일"]?.date?.start || "";

  // Notion page URL
  const notionUrl = page.url || "";

  return {
    id: page.id,
    slug: slug || page.id,
    title,
    summary,
    category,
    date,
    notionUrl,
  };
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Notion Posts Updater");
  console.log("═══════════════════════════════════════");

  // 환경변수 확인
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.warn("⚠️  NOTION_TOKEN or NOTION_DATABASE_ID not set. Skipping posts update.");
    // Secret 미설정 시 기존 파일 유지, 없으면 빈 파일 생성
    if (!existsSync(OUT_PATH)) {
      writeFileSync(OUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), posts: [] }, null, 2));
      console.log("📄 Created empty posts.json");
    }
    return;
  }

  console.log(`📡 Querying Notion database: ${NOTION_DATABASE_ID.slice(0, 8)}...`);

  try {
    const data = await queryNotionDatabase();
    const pages = data.results || [];

    console.log(`📝 Found ${pages.length} published post(s)`);

    const posts = pages.map(parsePage).filter(p => p.title);

    const output = {
      updatedAt: new Date().toISOString(),
      posts,
    };

    writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${posts.length} post(s) → public/posts.json`);

  } catch (err) {
    console.error("❌ Failed to fetch posts from Notion:", err.message);

    // 기존 파일이 있으면 유지, 없으면 빈 파일 생성
    if (!existsSync(OUT_PATH)) {
      writeFileSync(OUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), posts: [] }, null, 2));
      console.log("📄 Created empty posts.json (fallback)");
    } else {
      console.log("📄 Keeping existing posts.json");
    }
  }
}

main();
