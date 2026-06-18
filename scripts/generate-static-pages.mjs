#!/usr/bin/env node
/**
 * generate-static-pages.mjs — 정적 HTML 프리렌더 (v2)
 * Vite 빌드 후 실행하여 각 라우트별 index.html 생성
 * Googlebot이 JS 실행 없이도 meta/OG/구조화데이터를 읽을 수 있도록 함
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");
const templatePath = resolve(distDir, "index.html");
const postsPath = resolve(__dirname, "../public/posts.json");

const BASE_URL = "https://cross-border-remittance-lookup.web.app";
const SITE_NAME = "해외송금 수수료 비교";

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
  return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generatePage(html, { title, description, canonical, ogType, ogImage, articleSchema }) {
  let result = html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/name="description" content=".*?"/, `name="description" content="${escapeHtml(description)}"`)
    .replace(/property="og:title" content=".*?"/, `property="og:title" content="${escapeHtml(title)}"`)
    .replace(/property="og:description" content=".*?"/, `property="og:description" content="${escapeHtml(description)}"`)
    .replace(/property="og:url" content=".*?"/, `property="og:url" content="${canonical}"`)
    .replace(/property="twitter:title" content=".*?"/, `property="twitter:title" content="${escapeHtml(title)}"`)
    .replace(/property="twitter:description" content=".*?"/, `property="twitter:description" content="${escapeHtml(description)}"`)
    .replace(/property="twitter:url" content=".*?"/, `property="twitter:url" content="${canonical}"`)
    .replace(/rel="canonical" href=".*?"/, `rel="canonical" href="${canonical}"`);

  // OG type
  if (ogType) {
    result = result.replace(/property="og:type" content=".*?"/, `property="og:type" content="${ogType}"`);
  }

  // Article structured data (블로그 포스트용)
  if (articleSchema) {
    const schemaTag = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;
    result = result.replace("</head>", `    ${schemaTag}\n  </head>`);
  }

  return result;
}

let generated = 0;

// ═══════════════════════════════════════
// Blog list page
// ═══════════════════════════════════════
const blogDir = resolve(distDir, "blog");
mkdirSync(blogDir, { recursive: true });
writeFileSync(resolve(blogDir, "index.html"), generatePage(template, {
  title: "해외송금 블로그 | 송금 가이드, 비교 분석, 환율 동향",
  description: "해외송금 수수료 절약 가이드, 서비스 비교 분석, 환율 동향 등 유용한 정보를 제공합니다. Wise, 토스, 센트비 등 8개 서비스 전문 분석.",
  canonical: `${BASE_URL}/blog`,
  ogType: "blog",
}));
generated++;

// ═══════════════════════════════════════
// Individual blog posts — 고유 메타 + Article schema
// ═══════════════════════════════════════
for (const post of posts) {
  if (!post.slug) continue;
  const postDir = resolve(distDir, "blog", post.slug);
  mkdirSync(postDir, { recursive: true });

  const postTitle = `${post.title} | ${SITE_NAME}`;
  const postDesc = (post.summary || post.title).slice(0, 155);
  const postUrl = `${BASE_URL}/blog/${post.slug}`;

  // Article schema (Google 검색 결과 리치 스니펫)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": postDesc,
    "url": postUrl,
    "datePublished": post.date || new Date().toISOString().split("T")[0],
    "dateModified": post.date || new Date().toISOString().split("T")[0],
    "author": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": BASE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": BASE_URL,
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl,
    },
    "articleSection": post.category || "가이드",
    "inLanguage": "ko-KR",
  };

  writeFileSync(resolve(postDir, "index.html"), generatePage(template, {
    title: postTitle,
    description: postDesc,
    canonical: postUrl,
    ogType: "article",
    articleSchema,
  }));
  generated++;
}

// ═══════════════════════════════════════
// About page
// ═══════════════════════════════════════
mkdirSync(resolve(distDir, "about"), { recursive: true });
writeFileSync(resolve(distDir, "about", "index.html"), generatePage(template, {
  title: "서비스 소개 | 해외송금 공정 비교 — 8개 서비스 무료 비교",
  description: "해외송금 공정 비교기는 Wise, 토스, 센트비 등 8개 서비스의 수수료, 환율, 속도를 실시간으로 비교하는 100% 무료 서비스입니다. 편향 없는 데이터 기반 비교.",
  canonical: `${BASE_URL}/about`,
}));
generated++;

// ═══════════════════════════════════════
// Privacy page
// ═══════════════════════════════════════
mkdirSync(resolve(distDir, "privacy"), { recursive: true });
writeFileSync(resolve(distDir, "privacy", "index.html"), generatePage(template, {
  title: "개인정보 보호정책 | 해외송금 공정 비교기",
  description: "해외송금 공정 비교기의 개인정보 수집·이용·쿠키·Google AdSense 광고에 관한 정책입니다.",
  canonical: `${BASE_URL}/privacy`,
}));
generated++;

console.log(`✅ Generated ${generated} static pages in dist/`);
