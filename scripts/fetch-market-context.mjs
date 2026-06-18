#!/usr/bin/env node
/**
 * fetch-market-context.mjs — 일일 시장 분석 컨텍스트 생성
 * ─────────────────────────────────────────────────
 * 1. 실시간 환율 수집 (open.er-api.com)
 * 2. 전일 대비 변동률 계산 (fee-data.json 비교)
 * 3. 5년 히스토리 대비 백분위 계산
 * 4. 시즌/이벤트 감지
 * 5. 서비스별 최저비용 분석
 * → market-context.json 으로 출력 (generate-post-v2에서 사용)
 *
 * Run: node scripts/fetch-market-context.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FEE_DATA_PATH = resolve(__dirname, "../public/fee-data.json");
const HIST_DATA_PATH = resolve(__dirname, "../src/utils/histData.js");
const OUT_PATH = resolve(__dirname, "market-context.json");

// ═══════════════════════════════════════════════
// 통화 설정
// ═══════════════════════════════════════════════
const CURRENCIES = {
  USD: { name: "미국 달러", flag: "🇺🇸", unit: 1 },
  JPY: { name: "일본 엔(100)", flag: "🇯🇵", unit: 100 },
  EUR: { name: "유로", flag: "🇪🇺", unit: 1 },
  GBP: { name: "영국 파운드", flag: "🇬🇧", unit: 1 },
  CNY: { name: "중국 위안", flag: "🇨🇳", unit: 1 },
  AUD: { name: "호주 달러", flag: "🇦🇺", unit: 1 },
  CAD: { name: "캐나다 달러", flag: "🇨🇦", unit: 1 },
  SGD: { name: "싱가포르 달러", flag: "🇸🇬", unit: 1 },
};

// ═══════════════════════════════════════════════
// 1. 실시간 환율 가져오기
// ═══════════════════════════════════════════════
async function fetchLiveRates() {
  console.log("  📊 Fetching live rates...");
  const resp = await fetch("https://open.er-api.com/v6/latest/KRW");
  if (!resp.ok) throw new Error(`Rate API HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.result !== "success") throw new Error("Rate API failed");

  const rates = {};
  for (const [code, info] of Object.entries(CURRENCIES)) {
    const raw = data.rates[code];
    if (!raw) continue;
    rates[code] = Math.round((1 / raw) * info.unit);
  }
  return rates;
}

// ═══════════════════════════════════════════════
// 2. 이전 데이터와 비교 (변동률)
// ═══════════════════════════════════════════════
function loadPreviousRates() {
  if (!existsSync(FEE_DATA_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(FEE_DATA_PATH, "utf-8"));
    const rates = {};
    for (const [code, info] of Object.entries(data.rates || {})) {
      if (info.midRate) rates[code] = info.midRate;
    }
    return { rates, updatedAt: data.updatedAt || null };
  } catch { return null; }
}

function calcChanges(current, previous) {
  const changes = {};
  for (const [code, rate] of Object.entries(current)) {
    const prev = previous?.[code];
    if (prev && prev > 0) {
      const diff = rate - prev;
      const pct = ((diff / prev) * 100);
      changes[code] = {
        current: rate,
        previous: prev,
        diff,
        pctChange: +pct.toFixed(2),
        direction: pct > 0.05 ? "상승" : pct < -0.05 ? "하락" : "보합",
      };
    } else {
      changes[code] = {
        current: rate,
        previous: null,
        diff: 0,
        pctChange: 0,
        direction: "데이터없음",
      };
    }
  }
  return changes;
}

// ═══════════════════════════════════════════════
// 3. 히스토리 기반 분석 (5년 백분위)
// ═══════════════════════════════════════════════
function loadHistData() {
  // histData.js에서 HIST 객체를 추출
  if (!existsSync(HIST_DATA_PATH)) return null;
  const content = readFileSync(HIST_DATA_PATH, "utf-8");
  // JSON 부분만 추출
  const match = content.match(/export const HIST\s*=\s*(\{[\s\S]+\});?\s*$/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch { return null; }
}

function calcHistAnalysis(currentRates, hist) {
  if (!hist) return {};
  const analysis = {};

  for (const [code, rate] of Object.entries(currentRates)) {
    const data = hist[code];
    if (!data || data.length === 0) continue;

    const allRates = data.map(d => d.r);
    const sorted = [...allRates].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length);

    // 백분위: 현재 환율이 전체 히스토리에서 몇 % 위치인지
    const belowCount = sorted.filter(r => r <= rate).length;
    const percentile = Math.round((belowCount / sorted.length) * 100);

    // 최근 3개월 추세
    const recent3 = data.slice(-3).map(d => d.r);
    const recent3Avg = Math.round(recent3.reduce((a, b) => a + b, 0) / recent3.length);
    const trendDirection = rate > recent3Avg * 1.005 ? "상승" : rate < recent3Avg * 0.995 ? "하락" : "횡보";

    // 5년 최저/최고 근접 여부
    const nearMin = rate <= min * 1.03; // 최저 대비 3% 이내
    const nearMax = rate >= max * 0.97; // 최고 대비 3% 이내

    analysis[code] = {
      current: rate,
      min, max, avg,
      percentile,
      trendDirection,
      nearMin, nearMax,
      diffFromAvg: +((rate - avg) / avg * 100).toFixed(1),
      label: CURRENCIES[code]?.name || code,
    };
  }

  return analysis;
}

// ═══════════════════════════════════════════════
// 4. 시즌/이벤트 감지
// ═══════════════════════════════════════════════
function detectSeasonEvents() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  const dayOfWeek = now.getDay(); // 0=Sun
  const events = [];

  // 시즌 이벤트
  if (month >= 1 && month <= 3) events.push({ type: "season", name: "유학 준비 시즌", desc: "3월 학기 시작 전 유학비 송금 수요 증가" });
  if (month >= 7 && month <= 8) events.push({ type: "season", name: "여름 해외여행 성수기", desc: "여행 경비 환전·송금 수요 급증" });
  if (month === 8 || month === 9) events.push({ type: "season", name: "9월 유학 시즌", desc: "가을학기 등록금 송금 피크" });
  if (month === 12) events.push({ type: "season", name: "연말 해외송금 시즌", desc: "연말정산 전 해외 결제·송금 정리, 해외여행 성수기" });
  if (month === 1) events.push({ type: "season", name: "연말정산 시기", desc: "전년도 해외 소득·송금 내역 정리 필요" });

  // 2026 주요 금융 이벤트 (대략적 일정)
  const financialEvents2026 = [
    { month: 1, weeks: [3], name: "한은 금통위", desc: "기준금리 결정 → 원화 가치 변동 가능" },
    { month: 1, weeks: [4], name: "FOMC 회의", desc: "미 연준 금리 결정 → 달러 변동성" },
    { month: 3, weeks: [2], name: "한은 금통위", desc: "기준금리 결정" },
    { month: 3, weeks: [3], name: "FOMC/BOJ", desc: "미 연준+일은 금리 결정" },
    { month: 4, weeks: [3], name: "ECB 회의", desc: "유럽중앙은행 금리 결정" },
    { month: 5, weeks: [1], name: "FOMC 회의", desc: "미 연준 금리 결정" },
    { month: 5, weeks: [4], name: "한은 금통위", desc: "기준금리 결정" },
    { month: 6, weeks: [2], name: "FOMC/ECB", desc: "미 연준+ECB 금리 결정" },
    { month: 7, weeks: [3], name: "한은 금통위/BOJ", desc: "한은+일은 금리 결정" },
    { month: 7, weeks: [4], name: "FOMC 회의", desc: "미 연준 금리 결정" },
    { month: 9, weeks: [2], name: "ECB 회의", desc: "유럽중앙은행 금리 결정" },
    { month: 9, weeks: [3], name: "FOMC/BOJ", desc: "미 연준+일은 금리 결정" },
    { month: 10, weeks: [2], name: "한은 금통위", desc: "기준금리 결정" },
    { month: 11, weeks: [1], name: "FOMC 회의", desc: "미 연준 금리 결정" },
    { month: 11, weeks: [4], name: "한은 금통위", desc: "기준금리 결정" },
    { month: 12, weeks: [2], name: "FOMC/ECB", desc: "미 연준+ECB 금리 결정" },
    { month: 12, weeks: [3], name: "BOJ 회의", desc: "일본은행 금리 결정" },
  ];

  const weekOfMonth = Math.ceil(day / 7);
  for (const evt of financialEvents2026) {
    if (evt.month === month && evt.weeks.includes(weekOfMonth)) {
      events.push({ type: "financial", name: evt.name, desc: evt.desc });
    }
  }

  return events;
}

// ═══════════════════════════════════════════════
// 5. 서비스 비용 분석
// ═══════════════════════════════════════════════
function analyzeServiceCosts() {
  if (!existsSync(FEE_DATA_PATH)) return {};
  try {
    const feeData = JSON.parse(readFileSync(FEE_DATA_PATH, "utf-8"));
    const analysis = {};

    for (const [code, rateInfo] of Object.entries(feeData.rates || {})) {
      if (!rateInfo.services) continue;
      const supported = rateInfo.services.filter(s => s.supported);
      if (supported.length === 0) continue;

      // 총비용 기준 정렬 (100만원 기준)
      const sendAmount = 1000000;
      const ranked = supported.map(s => {
        const fee = s.fee || 0;
        const spread = s.spread || 0;
        const spreadCost = Math.round(sendAmount * spread / 100);
        return { name: s.name || s.kr || s.id, fee, spread, totalCost: fee + spreadCost, speed: s.speed, promotions: s.promotions || "" };
      }).sort((a, b) => a.totalCost - b.totalCost);

      analysis[code] = {
        cheapest: ranked[0],
        mostExpensive: ranked[ranked.length - 1],
        savingRange: ranked[ranked.length - 1].totalCost - ranked[0].totalCost,
        serviceCount: ranked.length,
      };
    }

    return analysis;
  } catch { return {}; }
}

// ═══════════════════════════════════════════════
// 6. fixed-fees 경과일 확인
// ═══════════════════════════════════════════════
function checkFixedFeesAge() {
  const fixedPath = resolve(__dirname, "fixed-fees.json");
  if (!existsSync(fixedPath)) return { daysSinceUpdate: -1, needsUpdate: true };
  try {
    const data = JSON.parse(readFileSync(fixedPath, "utf-8"));
    const lastUpdate = data._lastManualUpdate;
    if (!lastUpdate) return { daysSinceUpdate: -1, needsUpdate: true };
    const diff = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 86400000);
    return { daysSinceUpdate: diff, lastUpdate, needsUpdate: diff > 30 };
  } catch { return { daysSinceUpdate: -1, needsUpdate: true }; }
}

// ═══════════════════════════════════════════════
// 7. 주제 우선순위 판단
// ═══════════════════════════════════════════════
function determineTopicPriority(changes, histAnalysis, seasonEvents) {
  const signals = [];

  // P0: 급변 (±2% 이상)
  for (const [code, ch] of Object.entries(changes)) {
    if (Math.abs(ch.pctChange) >= 2) {
      signals.push({
        priority: "P0",
        type: "급변",
        currency: code,
        label: CURRENCIES[code]?.name || code,
        detail: `${ch.direction} ${Math.abs(ch.pctChange)}% (₩${ch.previous}→₩${ch.current})`,
        angle: `${CURRENCIES[code]?.name} 환율 ${Math.abs(ch.pctChange)}% ${ch.direction}, 해외송금 전략은?`,
      });
    }
  }

  // P1: 유의미한 변동 (±1% 이상)
  for (const [code, ch] of Object.entries(changes)) {
    if (Math.abs(ch.pctChange) >= 1 && Math.abs(ch.pctChange) < 2) {
      signals.push({
        priority: "P1",
        type: "변동",
        currency: code,
        label: CURRENCIES[code]?.name || code,
        detail: `${ch.direction} ${Math.abs(ch.pctChange)}%`,
        angle: `${CURRENCIES[code]?.name} ${ch.direction}세, 지금 송금 타이밍 분석`,
      });
    }
  }

  // P2: 시즌 이벤트
  for (const evt of seasonEvents) {
    signals.push({
      priority: "P2",
      type: evt.type === "financial" ? "금융이벤트" : "시즌",
      currency: null,
      label: evt.name,
      detail: evt.desc,
      angle: `${evt.name} 시기, 해외송금 비용 절약 전략`,
    });
  }

  // P3: 5년 최저/최고 근접
  for (const [code, ha] of Object.entries(histAnalysis)) {
    if (ha.nearMax) {
      signals.push({
        priority: "P3",
        type: "역사적고점",
        currency: code,
        label: ha.label,
        detail: `5년 최고(₩${ha.max}) 근접, 현재 ₩${ha.current} (상위 ${ha.percentile}%)`,
        angle: `${ha.label} 5년 최고치 근접, 송금 시 주의사항`,
      });
    }
    if (ha.nearMin) {
      signals.push({
        priority: "P3",
        type: "역사적저점",
        currency: code,
        label: ha.label,
        detail: `5년 최저(₩${ha.min}) 근접, 현재 ₩${ha.current} (하위 ${100 - ha.percentile}%)`,
        angle: `${ha.label} 5년 최저 근접, 해외송금 적기일까?`,
      });
    }
  }

  // P4: 기본 (위 조건 미해당 시 폴백)
  if (signals.length === 0) {
    signals.push({
      priority: "P4",
      type: "정기",
      currency: null,
      label: "일반",
      detail: "시장 안정기 — 교육/팁 콘텐츠 생산",
      angle: null, // AI에게 위임
    });
  }

  // 우선순위 순 정렬
  const order = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
  signals.sort((a, b) => order[a.priority] - order[b.priority]);

  return signals;
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  📡 Market Context Generator");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════\n");

  // 1. 실시간 환율
  const liveRates = await fetchLiveRates();
  console.log("  ✅ Live rates:", Object.entries(liveRates).map(([k, v]) => `${k}:₩${v}`).join(" · "));

  // 2. 전일 대비 변동
  const prevData = loadPreviousRates();
  const changes = calcChanges(liveRates, prevData?.rates);
  const movers = Object.entries(changes)
    .filter(([, ch]) => Math.abs(ch.pctChange) >= 0.3)
    .sort(([, a], [, b]) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
  if (movers.length > 0) {
    console.log("  📈 주요 변동:", movers.map(([k, ch]) => `${k} ${ch.pctChange > 0 ? "+" : ""}${ch.pctChange}%`).join(", "));
  } else {
    console.log("  📊 환율 변동 미미 (±0.3% 미만)");
  }

  // 3. 히스토리 분석
  const hist = loadHistData();
  const histAnalysis = calcHistAnalysis(liveRates, hist);

  // 4. 시즌/이벤트
  const seasonEvents = detectSeasonEvents();
  if (seasonEvents.length > 0) {
    console.log("  📅 이벤트:", seasonEvents.map(e => e.name).join(", "));
  }

  // 5. 서비스 비용 분석
  const serviceCosts = analyzeServiceCosts();

  // 6. fixed-fees 경과
  const fixedFeesStatus = checkFixedFeesAge();
  if (fixedFeesStatus.needsUpdate) {
    console.log(`  ⚠️ fixed-fees.json ${fixedFeesStatus.daysSinceUpdate}일 경과 — 갱신 필요!`);
  }

  // 7. 주제 우선순위
  const topicSignals = determineTopicPriority(changes, histAnalysis, seasonEvents);
  console.log(`  🎯 최우선 시그널: [${topicSignals[0].priority}] ${topicSignals[0].type} — ${topicSignals[0].label}`);

  // 8. 컨텍스트 JSON 생성
  const now = new Date();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const context = {
    generatedAt: now.toISOString(),
    date: now.toISOString().split("T")[0],
    dayOfWeek: dayNames[now.getDay()],
    rates: liveRates,
    changes,
    histAnalysis,
    seasonEvents,
    serviceCosts,
    topicSignals,
    fixedFeesStatus,
    summary: buildSummaryText(liveRates, changes, histAnalysis, seasonEvents, serviceCosts),
  };

  writeFileSync(OUT_PATH, JSON.stringify(context, null, 2), "utf-8");
  console.log(`\n  ✅ Saved: ${OUT_PATH}`);
  return context;
}

// ═══════════════════════════════════════════════
// 프롬프트용 요약 텍스트 생성
// ═══════════════════════════════════════════════
function buildSummaryText(rates, changes, histAnalysis, events, costs) {
  const lines = [];
  const now = new Date();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  lines.push(`[오늘의 시장 데이터 — ${now.toISOString().split("T")[0]} (${dayNames[now.getDay()]})]`);
  lines.push("");

  // 환율 현황
  lines.push("■ 주요 환율 (KRW 기준)");
  for (const [code, rate] of Object.entries(rates)) {
    const ch = changes[code];
    const ha = histAnalysis[code];
    const chStr = ch?.pctChange ? ` (전일 ${ch.pctChange > 0 ? "+" : ""}${ch.pctChange}%)` : "";
    const haStr = ha ? ` [5년 평균 ₩${ha.avg}, 백분위 ${ha.percentile}%, ${ha.trendDirection}세]` : "";
    lines.push(`  ${CURRENCIES[code]?.flag || ""} ${code}: ₩${rate.toLocaleString()}${chStr}${haStr}`);
  }

  // 주요 변동
  const bigMovers = Object.entries(changes).filter(([, ch]) => Math.abs(ch.pctChange) >= 0.5);
  if (bigMovers.length > 0) {
    lines.push("");
    lines.push("■ 주요 변동 통화");
    for (const [code, ch] of bigMovers) {
      lines.push(`  ${code}: ${ch.direction} ${Math.abs(ch.pctChange)}% (₩${ch.previous} → ₩${ch.current})`);
    }
  }

  // 역사적 위치
  const extremes = Object.entries(histAnalysis).filter(([, ha]) => ha.nearMin || ha.nearMax);
  if (extremes.length > 0) {
    lines.push("");
    lines.push("■ 역사적 극단 근접");
    for (const [code, ha] of extremes) {
      if (ha.nearMax) lines.push(`  ${code}: 5년 최고(₩${ha.max}) 근접 — 현재 ₩${ha.current} (상위 ${ha.percentile}%)`);
      if (ha.nearMin) lines.push(`  ${code}: 5년 최저(₩${ha.min}) 근접 — 현재 ₩${ha.current} (하위 ${100 - ha.percentile}%)`);
    }
  }

  // 서비스 비용
  lines.push("");
  lines.push("■ 100만원 송금 시 최저비용 서비스");
  for (const [code, cost] of Object.entries(costs)) {
    if (cost.cheapest) {
      lines.push(`  ${code}: ${cost.cheapest.name} (총비용 ₩${cost.cheapest.totalCost.toLocaleString()}) — 최대 ₩${cost.savingRange.toLocaleString()} 절약 가능`);
    }
  }

  // 이벤트
  if (events.length > 0) {
    lines.push("");
    lines.push("■ 오늘의 이벤트/시즌");
    for (const evt of events) {
      lines.push(`  [${evt.type}] ${evt.name}: ${evt.desc}`);
    }
  }

  return lines.join("\n");
}

// ═══════════════════════════════════════════════
// Export for use by generate-post-v2
// ═══════════════════════════════════════════════
export { main as fetchMarketContext };

main().catch(err => {
  console.error("❌ Market context generation failed:", err.message);
  process.exit(1);
});
