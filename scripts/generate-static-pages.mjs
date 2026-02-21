#!/usr/bin/env node
/**
 * generate-static-pages.mjs — 정적 HTML 프리렌더
 * Vite 빌드 후 실행하여 각 라우트별 index.html 생성
 * Googlebot이 JS 실행 없이도 meta 태그를 읽을 수 있도록 함
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");
const templatePath = resolve(distDir, "index.html");
const postsPath = resolve(__dirname, "../public/posts.json");

const BASE_URL = "https://cross-border-remittance-lookup.web.app";

if (!existsSync(templatePath)) {
  console.error("❌ dist/index.html not found. Run 'npm run build' first.");
  process.exit(1);
}

const template = readFileSync(templatePath, "utf-8");

let posts = [];
try {
  posts = JSON.parse(readFileSync(postsPath, "utf-8")).posts || [];
} catch {
  console.warn("⚠️ posts.json not found, skipping blog pages");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generatePage(html, { title, description, canonical }) {
  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/name="description" content=".*?"/, `name="description" content="${escapeHtml(description)}"`)
    .replace(/property="og:title" content=".*?"/, `property="og:title" content="${escapeHtml(title)}"`)
    .replace(/property="og:description" content=".*?"/, `property="og:description" content="${escapeHtml(description)}"`)
    .replace(/rel="canonical" href=".*?"/, `rel="canonical" href="${canonical}"`);
}

let generated = 0;

// Blog list page
const blogDir = resolve(distDir, "blog");
mkdirSync(blogDir, { recursive: true });
writeFileSync(resolve(blogDir, "index.html"), generatePage(template, {
  title: "해외송금 블로그 | 송금 가이드, 비교 분석, 환율 동향",
  description: "해외송금 수수료 절약 가이드, 서비스 비교 분석, 환율 동향 등 유용한 정보를 제공합니다.",
  canonical: `${BASE_URL}/blog`,
}));
generated++;

// Individual blog posts
for (const post of posts) {
  if (!post.slug) continue;
  const postDir = resolve(distDir, "blog", post.slug);
  mkdirSync(postDir, { recursive: true });
  writeFileSync(resolve(postDir, "index.html"), generatePage(template, {
    title: `${post.title} | 해외송금 비교`,
    description: post.summary || post.title,
    canonical: `${BASE_URL}/blog/${post.slug}`,
  }));
  generated++;
}

// About page
mkdirSync(resolve(distDir, "about"), { recursive: true });
writeFileSync(resolve(distDir, "about", "index.html"), generatePage(template, {
  title: "서비스 소개 | 해외송금 공정 비교기",
  description: "해외송금 공정 비교기는 8개 서비스의 수수료, 환율, 속도를 실시간으로 비교하는 무료 서비스입니다.",
  canonical: `${BASE_URL}/about`,
}));
generated++;

// Privacy page
mkdirSync(resolve(distDir, "privacy"), { recursive: true });
writeFileSync(resolve(distDir, "privacy", "index.html"), generatePage(template, {
  title: "개인정보 보호정책 | 해외송금 공정 비교기",
  description: "해외송금 공정 비교기의 개인정보 수집 및 이용에 관한 정책입니다.",
  canonical: `${BASE_URL}/privacy`,
}));
generated++;

console.log(`✅ Generated ${generated} static pages in dist/`);
