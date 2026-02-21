#!/usr/bin/env node
/**
 * generate-sitemap.mjs — 동적 사이트맵 생성
 * posts.json 기반으로 모든 블로그 URL을 포함하는 sitemap.xml 생성
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const postsPath = resolve(__dirname, "../public/posts.json");
const sitemapPath = resolve(__dirname, "../public/sitemap.xml");

const BASE_URL = "https://cross-border-remittance-lookup.web.app";
const today = new Date().toISOString().split("T")[0];

let posts = [];
try {
  posts = JSON.parse(readFileSync(postsPath, "utf-8")).posts || [];
} catch {
  console.warn("⚠️ posts.json not found, generating sitemap without blog posts");
}

const urls = [
  { loc: `${BASE_URL}/`, freq: "daily", priority: "1.0", lastmod: today },
  { loc: `${BASE_URL}/about`, freq: "monthly", priority: "0.5", lastmod: today },
  { loc: `${BASE_URL}/privacy`, freq: "monthly", priority: "0.3", lastmod: today },
  { loc: `${BASE_URL}/blog`, freq: "weekly", priority: "0.8", lastmod: today },
  ...posts.map(p => ({
    loc: `${BASE_URL}/blog/${p.slug}`,
    freq: "monthly",
    priority: "0.7",
    lastmod: p.date || today,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

writeFileSync(sitemapPath, xml);
console.log(`✅ Sitemap generated: ${urls.length} URLs → public/sitemap.xml`);
