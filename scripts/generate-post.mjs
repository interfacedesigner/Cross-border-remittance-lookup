#!/usr/bin/env node
/**
 * generate-post.mjs v2 — 시장 분석 기반 AI 블로그 자동 생산
 * ─────────────────────────────────────────────────
 * 1. market-context.json 로드 (fetch-market-context.mjs가 생성)
 * 2. 시장 시그널 기반 동적 주제 선정
 * 3. 실시간 데이터 주입 2단계 프롬프트 (분석→작성)
 * 4. SEO 최적화 메타데이터 + 구조화 데이터 생성
 * 5. 품질 검증 후 Notion 발행
 *
 * 환경변수:
 *   GROQ_API_KEY, NOTION_TOKEN, NOTION_DATABASE_ID
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTEXT_PATH = resolve(__dirname, "market-context.json");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const NOTION_API_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ═══════════════════════════════════════════════
// P4 폴백 주제 (시장 안정기용 교육/팁)
// ═══════════════════════════════════════════════
const FALLBACK_TOPICS = [
  { category: "팁", angle: "해외송금 수수료 50% 이상 절약하는 5가지 방법" },
  { category: "초보자", angle: "해외송금 vs 해외결제 차이점 완벽 정리" },
  { category: "가이드", angle: "SWIFT 송금이란? 초보자를 위한 완벽 설명" },
  { category: "팁", angle: "환율 알림 설정으로 최적 송금 타이밍 잡는 법" },
  { category: "초보자", angle: "IBAN 코드와 SWIFT 코드 쉽게 찾는 방법" },
  { category: "가이드", angle: "해외송금 한도와 외국환거래법 신고 기준 정리" },
  { category: "팁", angle: "대량 송금 시 비용을 최소화하는 분할 전략" },
  { category: "초보자", angle: "해외송금 수수료 구조 이해하기 | 숨은 비용 공개" },
  { category: "팁", angle: "해외송금 앱 설치부터 첫 송금까지 5분 가이드" },
  { category: "가이드", angle: "해외송금 세금 신고 방법 | 국세청 가이드" },
  { category: "비교/리뷰", angle: "은행 vs 핀테크 해외송금 어디가 유리할까" },
  { category: "초보자", angle: "해외송금 취소와 환불 가능할까? 완벽 가이드" },
];

// ═══════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════
// Notion: 기존 포스트 제목 + slug 조회
// ═══════════════════════════════════════════════
async function fetchExistingPosts() {
  const posts = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const resp = await fetch(`${NOTION_API_URL}/databases/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) break;
    const data = await resp.json();

    for (const page of data.results) {
      const titleArr = page.properties?.Name?.title || [];
      const title = titleArr.map(t => t.plain_text || "").join("").toLowerCase();
      const slugArr = page.properties?.["URL 슬러그"]?.rich_text || [];
      const slug = slugArr.map(t => t.plain_text || "").join("");
      const catSel = page.properties?.["카테고리"]?.select;
      const category = catSel?.name || "";
      const dateObj = page.properties?.["작성일"]?.date;
      const date = dateObj?.start || "";
      if (title) posts.push({ title, slug, category, date });
    }

    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  return posts;
}

// ═══════════════════════════════════════════════
// 중복 검사
// ═══════════════════════════════════════════════
function isDuplicate(title, slug, existingPosts) {
  const lower = title.toLowerCase();
  // 제목 완전 일치
  if (existingPosts.some(p => p.title === lower)) return true;
  // slug 일치
  if (slug && existingPosts.some(p => p.slug === slug)) return true;
  // 7일 내 동일 통화 키워드 재사용 방지
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const recentPosts = existingPosts.filter(p => p.date >= sevenDaysAgo);

  const currencyKeywords = ["달러", "엔", "유로", "파운드", "위안", "USD", "JPY", "EUR", "GBP", "CNY", "AUD", "CAD", "SGD"];
  const titleCurrencies = currencyKeywords.filter(kw => lower.includes(kw.toLowerCase()));

  for (const recent of recentPosts) {
    const matchCount = titleCurrencies.filter(kw => recent.title.includes(kw.toLowerCase())).length;
    if (matchCount >= 1 && recent.category === getCategory(lower)) return true;
  }

  return false;
}

function getCategory(titleLower) {
  if (titleLower.includes("비교") || titleLower.includes("리뷰")) return "비교/리뷰";
  if (titleLower.includes("가이드") || titleLower.includes("방법")) return "가이드";
  if (titleLower.includes("팁") || titleLower.includes("절약")) return "팁";
  if (titleLower.includes("전망") || titleLower.includes("분석") || titleLower.includes("급")) return "뉴스";
  return "가이드";
}

// ═══════════════════════════════════════════════
// Groq API 호출 (재시도 포함)
// ═══════════════════════════════════════════════
async function callGroqAPI(messages, maxTokens = 8192) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: maxTokens,
          top_p: 0.9,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (resp.status === 429 || resp.status >= 500) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`  ⚠️ Groq ${resp.status}, retry in ${delay}ms (${attempt + 1}/${MAX_RETRIES})`);
        if (attempt < MAX_RETRIES) { await sleep(delay); continue; }
      }

      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`Groq API ${resp.status}: ${body.slice(0, 200)}`);
      }

      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      if (attempt < MAX_RETRIES && (err.name === "TimeoutError" || err.name === "AbortError")) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
      } else if (attempt >= MAX_RETRIES) {
        throw err;
      }
    }
  }
  throw new Error("Groq API: all retries exhausted");
}

// ═══════════════════════════════════════════════
// 1단계: 시장 분석 → 주제/메타데이터 생성
// ═══════════════════════════════════════════════
async function generateTopicFromMarket(context, existingPosts) {
  const signal = context.topicSignals[0];
  const isMarketDriven = ["P0", "P1", "P2", "P3"].includes(signal.priority);

  // 최근 7일 카테고리 분포 분석 → 편중 방지
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const recentCats = {};
  for (const p of existingPosts.filter(p => p.date >= sevenDaysAgo)) {
    recentCats[p.category] = (recentCats[p.category] || 0) + 1;
  }
  const overusedCats = Object.entries(recentCats).filter(([, cnt]) => cnt >= 3).map(([cat]) => cat);
  const categoryHint = overusedCats.length > 0
    ? `\n⚠️ 최근 7일간 "${overusedCats.join('", "')}" 카테고리가 많습니다. 다른 카테고리(가이드, 비교/리뷰, 뉴스, 팁, 초보자)를 우선 선택하세요.`
    : "";

  const systemPrompt = `당신은 한국의 해외송금 전문 애널리스트이자 SEO 전문 블로그 작가입니다.
오늘의 실시간 시장 데이터를 분석하여 시의성 있는 블로그 주제를 선정합니다.
제공된 데이터만 사용하고, 추측이나 허위 정보를 포함하지 마세요.
반드시 유효한 JSON만 응답하세요.${categoryHint}`;

  let userPrompt;

  if (isMarketDriven) {
    userPrompt = `오늘의 시장 데이터를 분석하여 블로그 포스트 주제를 선정하고 메타데이터를 생성하세요.

${context.summary}

■ 최우선 시그널
- 유형: [${signal.priority}] ${signal.type}
- 대상: ${signal.label}
- 상세: ${signal.detail}
${signal.angle ? `- 추천 앵글: ${signal.angle}` : ""}

■ 최근 발행 제목 (중복 방지)
${existingPosts.slice(0, 10).map(p => `- ${p.title} (${p.date})`).join("\n")}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "title": "SEO 최적화 제목 (30-50자, | 구분자, 날짜 포함 권장)",
  "seoTitle": "검색엔진용 제목 (50-60자, 핵심 키워드 앞배치)",
  "metaDescription": "메타 설명 (120-155자, CTA 포함, 핵심 키워드 자연 배치)",
  "slug": "english-url-slug-with-date",
  "category": "뉴스 또는 가이드 또는 비교/리뷰 또는 팁 또는 초보자",
  "keywords": ["핵심키워드1", "핵심키워드2", "롱테일키워드3", "관련키워드4", "관련키워드5"],
  "outline": ["도입 섹션", "핵심 분석 섹션", "서비스 비교", "실전 전략", "주의사항", "자주 묻는 질문", "마무리"],
  "dataPoints": ["본문에 반드시 포함할 구체적 수치 3-5개"]
}

SEO 최적화 규칙:
- title: 검색 의도에 맞는 키워드를 앞부분에 배치 (예: "엔화 송금 | 오늘 환율 분석")
- slug: 날짜 포함 권장 (예: "jpy-remittance-analysis-june-2026")
- keywords: 검색량 높은 메인 키워드 2개 + 롱테일 3개 조합
- metaDescription: 행동 유도 문구 포함 ("지금 확인하세요", "비교해보세요")
- outline: 사용자 검색 의도에 맞는 H2 구조 (정보형/비교형/방법형)`;
  } else {
    // P4: 시장 안정기 — 폴백 주제 사용
    const fallback = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
    userPrompt = `다음 주제로 블로그 포스트 메타데이터를 생성하세요.

주제: ${fallback.angle}
카테고리: ${fallback.category}

${context.summary}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "title": "SEO 최적화 제목 (30-50자, | 구분자 사용)",
  "seoTitle": "검색엔진용 제목 (50-60자, 핵심 키워드 앞배치)",
  "metaDescription": "메타 설명 (120-155자, CTA 포함)",
  "slug": "english-url-slug",
  "category": "${fallback.category}",
  "keywords": ["핵심키워드1", "핵심키워드2", "롱테일키워드3", "관련키워드4", "관련키워드5"],
  "outline": ["섹션1", "섹션2", "섹션3", "섹션4", "섹션5", "자주 묻는 질문", "마무리"],
  "dataPoints": ["본문에 포함할 구체적 수치 3-5개"]
}

SEO 최적화 규칙:
- title: 검색 의도 키워드를 앞부분에 배치
- keywords: 메인 키워드 2개 + 롱테일 3개
- metaDescription: 행동 유도 문구 포함`;
  }

  const raw = await callGroqAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return parseAndValidateMetadata(raw);
}

function parseAndValidateMetadata(raw) {
  let meta;
  try { meta = JSON.parse(raw.trim()); } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) { try { meta = JSON.parse(match[0]); } catch {} }
  }
  if (!meta) throw new Error("Failed to parse metadata JSON");

  const required = ["title", "slug", "category", "keywords", "outline"];
  for (const key of required) {
    if (!meta[key]) throw new Error(`Missing: ${key}`);
  }

  // Defaults
  if (!meta.seoTitle) meta.seoTitle = meta.title;
  if (!meta.metaDescription) meta.metaDescription = meta.title + " - 해외송금 수수료 비교 분석";
  if (!meta.dataPoints) meta.dataPoints = [];

  // Sanitize
  meta.slug = meta.slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!meta.slug) meta.slug = `post-${Date.now()}`;
  if (!Array.isArray(meta.keywords)) meta.keywords = [meta.keywords];
  meta.keywords = meta.keywords.slice(0, 7);
  if (!Array.isArray(meta.outline)) meta.outline = [meta.outline];
  if (meta.title.length > 100) meta.title = meta.title.slice(0, 100);

  const validCategories = ["가이드", "비교/리뷰", "팁", "뉴스", "초보자"];
  if (!validCategories.includes(meta.category)) meta.category = "가이드";

  return meta;
}

// ═══════════════════════════════════════════════
// 2단계: 데이터 주입 본문 생성
// ═══════════════════════════════════════════════
async function generateContent(metadata, context) {
  const systemPrompt = `당신은 한국의 해외송금 전문 애널리스트이자 블로그 작가입니다.
오늘의 실시간 시장 데이터를 기반으로 정확하고 유용한 콘텐츠를 작성합니다.
제공된 데이터의 수치를 본문에 정확히 인용하세요. 추측이나 허위 정보를 포함하지 마세요.
마크다운 형식으로 본문만 작성하세요.`;

  const userPrompt = `다음 정보를 바탕으로 한국어 해외송금 블로그 포스트를 작성하세요.

■ 포스트 정보
- 제목: ${metadata.title}
- 카테고리: ${metadata.category}
- 키워드: ${metadata.keywords.join(", ")}
- 섹션 구성: ${metadata.outline.join(" / ")}
- 필수 포함 데이터: ${metadata.dataPoints?.join(" / ") || "아래 시장 데이터 참조"}

■ 오늘의 실시간 시장 데이터
${context.summary}

■ 작성 규칙 (엄격 준수)

[분량]
1. **3,000-4,000자** 분량 (한글 기준, 각 섹션 400-600자)
2. H2 섹션 6-8개 (## 형식)
3. **절대로 짧게 쓰지 마세요.** 각 섹션을 충실하게 작성하세요.

[데이터 정확성]
4. 위 시장 데이터의 구체적 수치를 본문에 10회 이상 인용
5. "약 ~원" 같은 모호한 표현 금지 → "₩1,474" 같이 정확한 숫자 사용
6. 5년 평균, 백분위, 변동률 등 데이터 적극 활용
7. 서비스별 수수료·스프레드 비교표 또는 번호 리스트 최소 1개

[SEO 최적화]
8. 핵심 키워드 "${metadata.keywords[0]}"를 본문에 5-8회 자연 분포
9. 첫 문단에 핵심 키워드와 오늘 날짜(${context.date}) 포함
10. 내부 링크: cross-border-remittance-lookup.web.app 사이트 자연스럽게 1-2회 언급
11. H2 제목에 키워드 변형 포함 (검색 노출 극대화)

[구조]
12. 도입부: 오늘의 핵심 인사이트로 시작 (데이터 인용)
13. 본론: 분석/비교/전략 (구체적 수치와 실전 시나리오)
14. FAQ: "## 자주 묻는 질문" (### Q 형식, 4-5개, 롱테일 키워드 포함)
15. 마무리: "## 마무리" 핵심 3-5줄 요약 + CTA

[문체]
16. 전문적이지만 친근한 존댓말 (-합니다, -세요)
17. 구체적인 숫자와 비교로 신뢰감 구축
18. 이모지 적절히 활용하여 가독성 향상

마크다운 형식으로 본문만 작성하세요 (H1 제목 제외).`;

  const body = await callGroqAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return body;
}

// ═══════════════════════════════════════════════
// 품질 검증
// ═══════════════════════════════════════════════
function validateContent(markdown) {
  const plainText = markdown.replace(/[#*\-\n\r\s]/g, "");
  const charCount = plainText.length;
  const h2Count = (markdown.match(/^## /gm) || []).length;
  const numberCount = (markdown.match(/₩[\d,]+|[\d,]+원|\d+%|\d+\.\d+%/g) || []).length;

  return {
    charCount,
    h2Count,
    numberCount,
    isAcceptable: charCount >= 1500 && h2Count >= 4,
    needsExtension: charCount < 2500,
    quality: charCount >= 3000 && h2Count >= 6 && numberCount >= 8 ? "excellent" :
             charCount >= 2000 && h2Count >= 5 ? "good" : "needs_improvement",
  };
}

async function extendContent(metadata, existingMarkdown, context) {
  const extension = await callGroqAPI([
    { role: "system", content: "당신은 한국의 해외송금 전문 블로그 작가입니다. 기존 글의 톤과 스타일을 유지하면서 보충합니다." },
    { role: "user", content: `다음 블로그 글에 추가 섹션을 작성하세요. 800-1200자로 작성해주세요.

제목: ${metadata.title}
기존 글 마지막: ${existingMarkdown.slice(-500)}

오늘의 데이터:
${context.summary.split("\n").slice(0, 15).join("\n")}

추가할 내용:
1. "## 실전 절약 전략" — 오늘 환율 기준 구체적 시나리오 (수치 포함)
2. "## 자주 묻는 질문" — Q&A 4-5개 (### Q 형식, 롱테일 키워드 자연 포함)
3. "## 마무리" — 핵심 요약 3-5줄

마크다운 형식으로만 작성하세요.` },
  ], 4096);
  return extension;
}

// ═══════════════════════════════════════════════
// 마크다운 → Notion 블록 변환
// ═══════════════════════════════════════════════
function parseInlineFormatting(text) {
  const richText = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      if (before) richText.push({ type: "text", text: { content: before } });
    }
    richText.push({
      type: "text",
      text: { content: match[1] },
      annotations: { bold: true },
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) richText.push({ type: "text", text: { content: remaining } });
  }

  return richText.length > 0 ? richText : [{ type: "text", text: { content: text } }];
}

function truncateRichText(richTextArr) {
  const result = [];
  for (const item of richTextArr) {
    const content = item.text?.content || "";
    if (content.length <= 2000) {
      result.push(item);
    } else {
      for (let i = 0; i < content.length; i += 2000) {
        result.push({ ...item, text: { ...item.text, content: content.slice(i, i + 2000) } });
      }
    }
  }
  return result;
}

function markdownToNotionBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.startsWith("## ")) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: line.slice(3).trim() } }] } });
    } else if (line.startsWith("### ")) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: line.slice(4).trim() } }] } });
    } else if (line.match(/^[-*]\s+/)) {
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: truncateRichText(parseInlineFormatting(line.replace(/^[-*]\s+/, "").trim())) } });
    } else if (line.match(/^\d+\.\s+/)) {
      blocks.push({ object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: truncateRichText(parseInlineFormatting(line.replace(/^\d+\.\s+/, "").trim())) } });
    } else {
      const text = line.trim();
      if (text) {
        blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: truncateRichText(parseInlineFormatting(text)) } });
      }
    }
  }

  return blocks.slice(0, 100);
}

// ═══════════════════════════════════════════════
// Notion 페이지 생성
// ═══════════════════════════════════════════════
async function createNotionPage(metadata, bodyBlocks) {
  const today = new Date().toISOString().split("T")[0];

  const payload = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      "Name": { title: [{ text: { content: metadata.title } }] },
      "메타 설명": { rich_text: [{ text: { content: (metadata.metaDescription || "").slice(0, 2000) } }] },
      "카테고리": { select: { name: metadata.category } },
      "상태": { select: { name: "발행됨" } },
      "URL 슬러그": { rich_text: [{ text: { content: metadata.slug } }] },
      "작성일": { date: { start: today } },
      "SEO 제목": { rich_text: [{ text: { content: (metadata.seoTitle || metadata.title).slice(0, 2000) } }] },
      "글자수": { number: metadata.charCount || 0 },
      "타겟 키워드": { multi_select: metadata.keywords.map(kw => ({ name: kw })) },
    },
    children: bodyBlocks,
  };

  const resp = await fetch(`${NOTION_API_URL}/pages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Notion create error ${resp.status}: ${body.slice(0, 300)}`);
  }

  return resp.json();
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  🤖 AI Post Generator v2 (Market-Driven)");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════");

  // 0. 환경변수 확인
  if (!GROQ_API_KEY || !NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.warn("⚠️  Missing env vars. Skipping.");
    return;
  }

  // 1. 시장 컨텍스트 로드
  if (!existsSync(CONTEXT_PATH)) {
    console.error("❌ market-context.json not found. Run fetch-market-context.mjs first.");
    return;
  }
  const context = JSON.parse(readFileSync(CONTEXT_PATH, "utf-8"));
  console.log(`\n📊 Market context: ${context.date} (${context.dayOfWeek})`);
  console.log(`  🎯 Top signal: [${context.topicSignals[0].priority}] ${context.topicSignals[0].type} — ${context.topicSignals[0].label}`);

  // 2. 기존 포스트 조회
  console.log("\n📡 Fetching existing posts...");
  let existingPosts = [];
  try {
    existingPosts = await fetchExistingPosts();
  } catch (err) {
    console.warn(`  ⚠️ ${err.message}`);
  }
  console.log(`  📝 ${existingPosts.length} existing posts`);

  // 3. 1단계: 주제 + 메타데이터 생성
  console.log("\n🤖 Step 1: Generating topic & metadata...");
  let metadata;
  try {
    metadata = await generateTopicFromMarket(context, existingPosts);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    return;
  }
  console.log(`  📋 Title: ${metadata.title}`);
  console.log(`  🏷️ ${metadata.category} | 🔗 ${metadata.slug}`);
  console.log(`  🔑 ${metadata.keywords.join(", ")}`);
  console.log(`  📝 SEO: ${metadata.seoTitle}`);

  // 4. 중복 확인
  if (isDuplicate(metadata.title, metadata.slug, existingPosts)) {
    console.warn("  ⚠️ Duplicate detected. Skipping.");
    return;
  }

  // 5. 2단계: 데이터 주입 본문 생성
  console.log("\n🤖 Step 2: Generating content with market data...");
  let bodyMarkdown;
  try {
    bodyMarkdown = await generateContent(metadata, context);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    return;
  }

  // 6. 품질 검증
  let quality = validateContent(bodyMarkdown);
  console.log(`  📏 ${quality.charCount}자 | H2: ${quality.h2Count}개 | 수치: ${quality.numberCount}개 | ${quality.quality}`);

  // 7. 보충 (필요 시)
  if (quality.needsExtension && quality.isAcceptable) {
    console.log("  📝 Extending content...");
    try {
      const extension = await extendContent(metadata, bodyMarkdown, context);
      bodyMarkdown += "\n\n" + extension;
      quality = validateContent(bodyMarkdown);
      console.log(`  📏 Extended: ${quality.charCount}자 | ${quality.quality}`);
    } catch (err) {
      console.warn(`  ⚠️ Extension failed: ${err.message}`);
    }
  }

  if (!quality.isAcceptable) {
    console.warn(`  ⚠️ Content too short (${quality.charCount}자). Skipping.`);
    return;
  }

  metadata.charCount = quality.charCount;

  // 8. Notion 발행
  const blocks = markdownToNotionBlocks(bodyMarkdown);
  console.log(`\n📤 Publishing to Notion (${blocks.length} blocks)...`);
  try {
    const page = await createNotionPage(metadata, blocks);
    console.log(`  ✅ Published: ${page.url}`);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    return;
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  ✅ Complete: ${metadata.title}`);
  console.log(`  📊 Quality: ${quality.quality} (${quality.charCount}자)`);
  console.log("═══════════════════════════════════════");
}

main().catch(err => {
  console.error("❌ Post generation failed:", err.message);
});
