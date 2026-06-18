#!/usr/bin/env node
/**
 * generate-post.mjs — AI 블로그 포스트 자동 생성 ($0)
 * ─────────────────────────────────────────────────
 * 1. Groq API (Llama 3.3 70B, 무료) → 한국어 SEO 블로그 생성
 * 2. Notion API → DB에 발행 상태로 페이지 생성
 * 3. GitHub Actions cron 화/목 09:00 KST
 *
 * 환경변수:
 *   GROQ_API_KEY       — Groq API 시크릿
 *   NOTION_TOKEN       — Notion Internal Integration 시크릿
 *   NOTION_DATABASE_ID — Notion 데이터베이스 ID
 *
 * Run: GROQ_API_KEY=xxx NOTION_TOKEN=xxx NOTION_DATABASE_ID=xxx node scripts/generate-post.mjs
 */

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════

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
// Topic Pool (카테고리별 주제)
// ═══════════════════════════════════════════════

const TOPIC_POOL = [
  // 가이드
  { category: "가이드", angle: "미국 송금 완벽 가이드 | 계좌이체부터 수령까지" },
  { category: "가이드", angle: "일본 엔화 송금 시 주의사항과 절약 팁" },
  { category: "가이드", angle: "유럽 송금 SEPA vs SWIFT 차이점 완벽 정리" },
  { category: "가이드", angle: "중국 위안화 송금의 모든 것 | 규제와 방법" },
  { category: "가이드", angle: "호주 송금 가이드 | 유학생과 이민자를 위한 팁" },
  { category: "가이드", angle: "캐나다 달러 송금 절차와 수수료 절약법" },
  { category: "가이드", angle: "싱가포르 송금 가이드 | 가장 빠르고 저렴한 방법" },
  { category: "가이드", angle: "영국 파운드 송금 가이드 | 유학비와 생활비" },
  { category: "가이드", angle: "SWIFT 송금이란? 초보자를 위한 완벽 설명" },
  { category: "가이드", angle: "해외송금 한도와 외국환거래법 신고 기준 정리" },
  { category: "가이드", angle: "해외송금 세금 신고 방법 | 국세청 가이드" },
  { category: "가이드", angle: "해외 부동산 구매를 위한 대금 송금 절차" },
  { category: "가이드", angle: "해외송금 수취인 정보 정확히 입력하는 방법" },

  // 비교/리뷰
  { category: "비교/리뷰", angle: "Wise vs 하나은행 해외송금 상세 비교" },
  { category: "비교/리뷰", angle: "모인 vs 센트비 해외송금 서비스 비교 분석" },
  { category: "비교/리뷰", angle: "와이어바알리 vs Wise 수수료 및 속도 비교" },
  { category: "비교/리뷰", angle: "은행 vs 핀테크 해외송금 어디가 유리할까" },
  { category: "비교/리뷰", angle: "토스 vs 하나은행 해외송금 비교 | 2026" },
  { category: "비교/리뷰", angle: "PayPal vs Wise 해외 결제 및 송금 비교" },
  { category: "비교/리뷰", angle: "2026 해외송금 서비스 종합 순위 TOP 8" },
  { category: "비교/리뷰", angle: "신한은행 vs 하나은행 해외송금 수수료 비교" },

  // 팁
  { category: "팁", angle: "해외송금 수수료 50% 이상 절약하는 5가지 방법" },
  { category: "팁", angle: "환율 우대 쿠폰과 프로모션 활용 꿀팁 모음" },
  { category: "팁", angle: "대량 송금 시 비용을 최소화하는 분할 전략" },
  { category: "팁", angle: "정기 송금 자동화로 시간과 비용 절약하기" },
  { category: "팁", angle: "환율 알림 설정으로 최적 송금 타이밍 잡는 법" },
  { category: "팁", angle: "해외직구 결제 vs 해외송금 | 어떤 게 유리할까" },
  { category: "팁", angle: "연말 해외송금 절세 전략 | 세금 신고 팁" },
  { category: "팁", angle: "해외송금 앱 설치부터 첫 송금까지 5분 가이드" },

  // 뉴스
  { category: "뉴스", angle: "2026 원달러 환율 전망과 송금 전략" },
  { category: "뉴스", angle: "핀테크 해외송금 시장 성장 동향 | 2026 분석" },
  { category: "뉴스", angle: "한국은행 외환 규제 변화가 송금에 미치는 영향" },
  { category: "뉴스", angle: "글로벌 실시간 송금 시대 | SWIFT gpi와 미래" },
  { category: "뉴스", angle: "디지털 원화(CBDC)와 해외송금의 미래" },
  { category: "뉴스", angle: "AI 활용 환율 예측 | 송금 타이밍 최적화 트렌드" },

  // 초보자
  { category: "초보자", angle: "환율이란? 해외송금 초보자를 위한 쉬운 설명" },
  { category: "초보자", angle: "해외송금 vs 해외결제 차이점 완벽 정리" },
  { category: "초보자", angle: "처음 해외송금할 때 필요한 서류 체크리스트" },
  { category: "초보자", angle: "IBAN 코드와 SWIFT 코드 쉽게 찾는 방법" },
  { category: "초보자", angle: "해외송금 수수료 구조 이해하기 | 숨은 비용 공개" },
  { category: "초보자", angle: "중개은행 수수료란? 왜 추가 비용이 발생할까" },
  { category: "초보자", angle: "해외송금 소요 시간 총정리 | 서비스별 비교" },
  { category: "초보자", angle: "해외송금 취소와 환불 가능할까? 완벽 가이드" },
];

// ═══════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ═══════════════════════════════════════════════
// 1. Notion — 기존 포스트 제목 조회 (중복 방지)
// ═══════════════════════════════════════════════

async function fetchAllPostTitles() {
  const titles = [];
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

    if (!resp.ok) {
      console.warn(`  ⚠️ Notion query error ${resp.status}, using partial results`);
      break;
    }

    const data = await resp.json();
    for (const page of data.results) {
      const titleArr = page.properties?.Name?.title || [];
      const title = titleArr.map(t => t.plain_text || "").join("");
      if (title) titles.push(title.toLowerCase());
    }

    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  return titles;
}

// ═══════════════════════════════════════════════
// 2. 토픽 선택 (중복 방지)
// ═══════════════════════════════════════════════

function isTopicCovered(angle, existingTitles) {
  const keywords = angle.split(/[\s|·,/]+/).filter(w => w.length >= 2);
  return existingTitles.some(title => {
    const matchCount = keywords.filter(kw => title.includes(kw.toLowerCase())).length;
    return matchCount >= 2;
  });
}

function selectTopic(existingTitles) {
  // Filter out already-covered topics
  const available = TOPIC_POOL.filter(t => !isTopicCovered(t.angle, existingTitles));

  if (available.length === 0) {
    console.log("  📭 All topics covered, will ask AI for new topic");
    return null; // Signal to use AI fallback
  }

  // Random selection
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}

// ═══════════════════════════════════════════════
// 3. Groq API 호출
// ═══════════════════════════════════════════════

async function callGroqAPI(messages) {
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
          max_tokens: 8192,
          top_p: 0.9,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (resp.status === 429 || resp.status >= 500) {
        const retryAfter = parseInt(resp.headers.get("retry-after") || "0", 10);
        const delay = Math.max(retryAfter * 1000, RETRY_DELAY_MS * Math.pow(2, attempt));
        console.warn(`  ⚠️ Groq API ${resp.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        if (attempt < MAX_RETRIES) { await sleep(delay); continue; }
      }

      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`Groq API error ${resp.status}: ${body}`);
      }

      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      if (attempt < MAX_RETRIES && (err.name === "TimeoutError" || err.name === "AbortError")) {
        console.warn(`  ⚠️ Timeout, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
      } else if (attempt >= MAX_RETRIES) {
        throw err;
      }
    }
  }
  throw new Error("Groq API: all retries exhausted");
}

// ═══════════════════════════════════════════════
// 4. AI 메타데이터 생성
// ═══════════════════════════════════════════════

async function generateMetadata(topic) {
  const systemPrompt = "당신은 한국의 해외송금 전문 블로그 작가입니다. SEO에 최적화된 한국어 블로그 콘텐츠를 작성합니다. 반드시 유효한 JSON만 응답하세요.";

  let userPrompt;
  if (topic) {
    userPrompt = `다음 주제에 대한 블로그 포스트 메타데이터를 JSON 형식으로 생성해주세요.

주제: ${topic.angle}
카테고리: ${topic.category}

반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만):
{
  "title": "SEO 최적화된 제목 (30-50자, | 구분자 사용)",
  "seoTitle": "검색엔진용 제목 (50-60자)",
  "metaDescription": "메타 설명 (120-155자, 핵심 키워드 포함)",
  "slug": "english-url-slug-format",
  "category": "${topic.category}",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "outline": ["섹션1 제목", "섹션2 제목", "섹션3 제목", "섹션4 제목", "섹션5 제목", "섹션6 제목", "자주 묻는 질문"]
}

주의사항:
- title에는 반드시 | 구분자를 사용하세요 (예: "미국 송금 가이드 | 2026 최신 정보")
- slug는 영어 소문자와 하이픈만 사용 (예: "us-remittance-guide-2026")
- keywords는 해외송금 관련 한국어 검색 키워드 5개
- outline은 블로그 본문의 H2 섹션 제목 6-7개 (마지막은 반드시 "자주 묻는 질문")
- 2026년 최신 정보임을 반영하세요`;
  } else {
    // AI fallback: topic pool 소진 시
    userPrompt = `해외송금 관련 새로운 블로그 주제를 정하고, 메타데이터를 JSON 형식으로 생성해주세요.
카테고리는 다음 중 하나: 가이드, 비교/리뷰, 팁, 뉴스, 초보자

반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만):
{
  "title": "SEO 최적화된 제목 (30-50자, | 구분자 사용)",
  "seoTitle": "검색엔진용 제목 (50-60자)",
  "metaDescription": "메타 설명 (120-155자, 핵심 키워드 포함)",
  "slug": "english-url-slug-format",
  "category": "카테고리명",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "outline": ["섹션1 제목", "섹션2 제목", "섹션3 제목", "섹션4 제목", "섹션5 제목", "섹션6 제목", "자주 묻는 질문"]
}`;
  }

  const raw = await callGroqAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return parseMetadataJSON(raw);
}

function parseMetadataJSON(raw) {
  // Try direct parse
  try {
    const parsed = JSON.parse(raw.trim());
    return validateMetadata(parsed);
  } catch {}

  // Try extracting JSON from markdown code block or surrounding text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateMetadata(parsed);
    } catch {}
  }

  throw new Error("Failed to parse metadata JSON from Groq response");
}

function validateMetadata(meta) {
  const required = ["title", "seoTitle", "metaDescription", "slug", "category", "keywords", "outline"];
  for (const key of required) {
    if (!meta[key]) throw new Error(`Missing metadata field: ${key}`);
  }

  // Sanitize slug
  meta.slug = meta.slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!meta.slug) meta.slug = `post-${Date.now()}`;

  // Ensure keywords is array with max 5
  if (!Array.isArray(meta.keywords)) meta.keywords = [meta.keywords];
  meta.keywords = meta.keywords.slice(0, 5);

  // Ensure outline is array
  if (!Array.isArray(meta.outline)) meta.outline = [meta.outline];

  // Truncate title if too long
  if (meta.title.length > 100) {
    const pipeIdx = meta.title.lastIndexOf("|");
    meta.title = pipeIdx > 20 ? meta.title.slice(0, pipeIdx).trim() : meta.title.slice(0, 100);
  }

  // Validate category
  const validCategories = ["가이드", "비교/리뷰", "팁", "뉴스", "초보자"];
  if (!validCategories.includes(meta.category)) {
    meta.category = "가이드"; // default fallback
  }

  return meta;
}

// ═══════════════════════════════════════════════
// 5. AI 본문 생성
// ═══════════════════════════════════════════════

async function generateBody(metadata) {
  const systemPrompt = "당신은 한국의 해외송금 전문 블로그 작가입니다. SEO에 최적화된 한국어 블로그 콘텐츠를 작성합니다. 마크다운 형식으로 본문만 작성하세요.";

  const userPrompt = `다음 주제로 한국어 해외송금 블로그 포스트 본문을 작성해주세요.

제목: ${metadata.title}
카테고리: ${metadata.category}
키워드: ${metadata.keywords.join(", ")}
섹션 구성: ${metadata.outline.join(" / ")}

작성 규칙:
1. **2500-3500자** 분량으로 작성 (한글 기준, 충분히 깊이 있는 콘텐츠)
2. 각 섹션은 "## 섹션제목" 형식의 마크다운 H2로 시작 (6-7개 섹션)
3. 각 섹션당 **300-500자** 이상 작성
4. 핵심 키워드를 자연스럽게 본문에 5-8회 포함
5. 실용적이고 구체적인 정보 제공 (수수료 금액, 환율 스프레드 %, 서비스명, 절차 등)
6. 한국에서 사용 가능한 송금 서비스 언급 (Wise, 센트비, 모인, 와이어바알리, 토스, 하나은행, 신한은행, PayPal)
7. 문체: 전문적이지만 친근한 존댓말 (-합니다, -세요)
8. 마지막에 "## 자주 묻는 질문" 섹션 포함 (Q&A 형식으로 3-4개, 각 질문은 ### 로 시작)
9. 그 다음 "## 마무리" 섹션으로 핵심 내용 3-5줄 요약
10. 구체적인 숫자, 비교 데이터, 실제 시나리오 예시 적극 활용
11. 💡 이모지를 적절히 활용하여 가독성 향상
12. cross-border-remittance-lookup.web.app 사이트에서 8개 서비스를 실시간 비교 가능하다고 자연스럽게 1-2회 언급
13. 필요시 비교표나 번호 리스트를 적극 활용
14. **절대로 짧게 쓰지 마세요.** 각 섹션을 충실하게 작성하세요.

마크다운 형식으로 본문만 작성하세요 (제목 H1은 포함하지 마세요).`;

  const body = await callGroqAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return body;
}

// ═══════════════════════════════════════════════
// 6. 마크다운 → Notion 블록 변환
// ═══════════════════════════════════════════════

function parseInlineFormatting(text) {
  const richText = [];
  // Handle **bold** patterns
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before bold
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      if (before) richText.push({ type: "text", text: { content: before } });
    }
    // Bold text
    richText.push({
      type: "text",
      text: { content: match[1] },
      annotations: { bold: true },
    });
    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) richText.push({ type: "text", text: { content: remaining } });
  }

  return richText.length > 0 ? richText : [{ type: "text", text: { content: text } }];
}

function truncateRichText(richTextArr) {
  // Notion limits each text object content to 2000 chars
  const result = [];
  for (const item of richTextArr) {
    const content = item.text?.content || "";
    if (content.length <= 2000) {
      result.push(item);
    } else {
      // Split into chunks of 2000
      for (let i = 0; i < content.length; i += 2000) {
        const chunk = content.slice(i, i + 2000);
        result.push({
          ...item,
          text: { ...item.text, content: chunk },
        });
      }
    }
  }
  return result;
}

function markdownToNotionBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) continue;

    // H2 heading
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: text } }],
        },
      });
      continue;
    }

    // H3 heading
    if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: text } }],
        },
      });
      continue;
    }

    // Bullet list
    if (line.match(/^[-*]\s+/)) {
      const text = line.replace(/^[-*]\s+/, "").trim();
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: truncateRichText(parseInlineFormatting(text)),
        },
      });
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s+/)) {
      const text = line.replace(/^\d+\.\s+/, "").trim();
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: truncateRichText(parseInlineFormatting(text)),
        },
      });
      continue;
    }

    // Regular paragraph
    const text = line.trim();
    if (text) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: truncateRichText(parseInlineFormatting(text)),
        },
      });
    }
  }

  // Notion API limits 100 blocks per request
  return blocks.slice(0, 100);
}

// ═══════════════════════════════════════════════
// 7. Notion 페이지 생성
// ═══════════════════════════════════════════════

async function createNotionPage(metadata, bodyBlocks) {
  const today = new Date().toISOString().split("T")[0];

  const payload = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      "Name": {
        title: [{ text: { content: metadata.title } }],
      },
      "메타 설명": {
        rich_text: [{ text: { content: metadata.metaDescription.slice(0, 2000) } }],
      },
      "카테고리": {
        select: { name: metadata.category },
      },
      "상태": {
        select: { name: "발행됨" },
      },
      "URL 슬러그": {
        rich_text: [{ text: { content: metadata.slug } }],
      },
      "작성일": {
        date: { start: today },
      },
      "SEO 제목": {
        rich_text: [{ text: { content: (metadata.seoTitle || metadata.title).slice(0, 2000) } }],
      },
      "글자수": {
        number: metadata.charCount || 0,
      },
      "타겟 키워드": {
        multi_select: metadata.keywords.map(kw => ({ name: kw })),
      },
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
    throw new Error(`Notion create page error ${resp.status}: ${body}`);
  }

  return resp.json();
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  🤖 AI Post Generator (Groq + Notion)");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════");

  // 1. 환경변수 확인
  if (!GROQ_API_KEY || !NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.warn("⚠️  Missing env vars (GROQ_API_KEY, NOTION_TOKEN, NOTION_DATABASE_ID). Skipping post generation.");
    return;
  }

  // 2. 기존 포스트 제목 조회
  console.log("\n📡 Fetching existing posts from Notion...");
  let existingTitles;
  try {
    existingTitles = await fetchAllPostTitles();
  } catch (err) {
    console.warn(`  ⚠️ Failed to fetch existing posts: ${err.message}`);
    existingTitles = [];
  }
  console.log(`  📝 Found ${existingTitles.length} existing post(s)`);

  // 3. 토픽 선택
  console.log("\n🎯 Selecting topic...");
  const topic = selectTopic(existingTitles);
  if (topic) {
    console.log(`  📂 Category: ${topic.category}`);
    console.log(`  📌 Angle: ${topic.angle}`);
  } else {
    console.log("  🤖 Using AI to generate a new topic...");
  }

  // 4. 메타데이터 생성
  console.log("\n🤖 Generating metadata via Groq API...");
  let metadata;
  try {
    metadata = await generateMetadata(topic);
  } catch (err) {
    console.error(`  ❌ Metadata generation failed: ${err.message}`);
    return;
  }
  console.log(`  📋 Title: ${metadata.title}`);
  console.log(`  🏷️ Category: ${metadata.category}`);
  console.log(`  🔗 Slug: ${metadata.slug}`);
  console.log(`  🔑 Keywords: ${metadata.keywords.join(", ")}`);

  // 5. 제목 중복 최종 확인
  if (existingTitles.some(t => t === metadata.title.toLowerCase())) {
    console.warn("  ⚠️ Generated title matches existing post. Skipping creation.");
    return;
  }

  // 6. 본문 생성
  console.log("\n🤖 Generating blog content via Groq API...");
  let bodyMarkdown;
  try {
    bodyMarkdown = await generateBody(metadata);
  } catch (err) {
    console.error(`  ❌ Content generation failed: ${err.message}`);
    return;
  }

  // 7. 콘텐츠 품질 확인
  const plainText = bodyMarkdown.replace(/[#*\-\n\r\s]/g, "");
  const charCount = plainText.length;
  console.log(`  📏 Content: ${charCount} characters`);
  metadata.charCount = charCount;

  if (charCount < 500) {
    console.warn("  ⚠️ Generated content too short. Skipping.");
    return;
  }

  // 보충 생성: 1500-2000자 사이면 추가 섹션 요청
  if (charCount < 2000) {
    console.log("  ⚠️ Content shorter than ideal, requesting extension...");
    try {
      const extension = await callGroqAPI([
        { role: "system", content: "당신은 한국의 해외송금 전문 블로그 작가입니다." },
        { role: "user", content: `다음 블로그 글에 추가할 보충 내용을 800-1200자로 작성해주세요.
기존 글 제목: ${metadata.title}
기존 글 마지막 부분: ${bodyMarkdown.slice(-300)}

추가할 내용:
1. "## 실전 꿀팁" 또는 "## 추가로 알아두면 좋은 점" 섹션
2. "## 자주 묻는 질문" 섹션 (Q&A 3-4개, 질문은 ### 형식)

마크다운 형식으로만 작성하세요.` },
      ]);
      bodyMarkdown += "\n\n" + extension;
      const newPlainText = bodyMarkdown.replace(/[#*\-\n\r\s]/g, "");
      const newCharCount = newPlainText.length;
      console.log(`  📏 Extended content: ${newCharCount} characters`);
      metadata.charCount = newCharCount;
    } catch (err) {
      console.warn(`  ⚠️ Extension failed: ${err.message}, proceeding with original content`);
    }
  }

  // 8. 마크다운 → Notion 블록 변환
  const blocks = markdownToNotionBlocks(bodyMarkdown);
  console.log(`  🧱 Converted to ${blocks.length} Notion blocks`);

  // 9. Notion 페이지 생성
  console.log("\n📤 Creating Notion page...");
  try {
    const page = await createNotionPage(metadata, blocks);
    console.log(`  ✅ Created: ${page.url}`);
  } catch (err) {
    console.error(`  ❌ Notion page creation failed: ${err.message}`);
    return;
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  ✅ Post generation complete!`);
  console.log(`  📋 ${metadata.title}`);
  console.log("═══════════════════════════════════════");
}

main().catch(err => {
  console.error("❌ Post generation failed:", err.message);
  // Do NOT process.exit(1) — non-critical step, pipeline should continue
});
