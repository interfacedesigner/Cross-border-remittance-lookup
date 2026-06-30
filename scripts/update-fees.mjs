#!/usr/bin/env node
/**
 * update-fees.mjs — 완전 무료 자동 업데이트 ($0)
 * ─────────────────────────────────────────────────
 * 1. 환율: open.er-api.com (무료, API키 불필요)
 * 2. 수수료: Wise Comparison API (무료, 인증 불필요)
 *    + 한국 서비스 수수료 고정값 (월 1-2회 수동 갱신)
 * 3. GitHub Actions cron 매일 09:00 KST
 *
 * Run: node scripts/update-fees.mjs
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../public/fee-data.json");
const FIXED_FEES_PATH = resolve(__dirname, "fixed-fees.json");

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════
const CURRENCIES = ["USD", "JPY", "EUR", "GBP", "CNY", "AUD", "CAD", "SGD"];
const CURRENCY_META = {
  USD: { name: "미국 달러", flag: "🇺🇸", symbol: "$", unit: 1 },
  JPY: { name: "일본 엔(100)", flag: "🇯🇵", symbol: "¥", unit: 100 },
  EUR: { name: "유로", flag: "🇪🇺", symbol: "€", unit: 1 },
  GBP: { name: "영국 파운드", flag: "🇬🇧", symbol: "£", unit: 1 },
  CNY: { name: "중국 위안", flag: "🇨🇳", symbol: "¥", unit: 1 },
  AUD: { name: "호주 달러", flag: "🇦🇺", symbol: "A$", unit: 1 },
  CAD: { name: "캐나다 달러", flag: "🇨🇦", symbol: "C$", unit: 1 },
  SGD: { name: "싱가포르 달러", flag: "🇸🇬", symbol: "S$", unit: 1 },
};

// 금액 구간 정책: 30만 / 100만 / 300만 / 500만 / 1000만
const SEND_AMOUNTS = [300000, 1000000, 3000000, 5000000, 10000000];
const DEFAULT_AMOUNT = 1000000; // UI 기본 표시용
const SEND_AMOUNT_KRW = DEFAULT_AMOUNT; // 하위 호환

// ═══════════════════════════════════════════════
// 1. 무료 환율 API (open.er-api.com)
// ═══════════════════════════════════════════════
async function fetchMidRates() {
  console.log("  📊 Fetching mid-market rates from open.er-api.com...");
  const resp = await fetch("https://open.er-api.com/v6/latest/KRW");
  if (!resp.ok) throw new Error(`Exchange rate API HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.result !== "success") throw new Error("Exchange rate API failed: " + data["error-type"]);

  const rates = {};
  for (const cur of CURRENCIES) {
    const rawRate = data.rates[cur];
    if (!rawRate) { console.warn(`    ⚠️ No rate for ${cur}`); continue; }
    // rawRate is KRW→CUR, we need CUR→KRW (how many KRW per 1 unit of foreign currency)
    const unit = CURRENCY_META[cur].unit || 1;
    rates[cur] = Math.round((1 / rawRate) * unit);
  }
  console.log("    ✅ Rates:", Object.entries(rates).map(([k, v]) => `${k}:₩${v}`).join(" · "));
  return rates;
}

// ═══════════════════════════════════════════════
// 2. Wise Comparison API (무료, 인증 불필요)
//    Returns Wise + competitors' fees and rates
// ═══════════════════════════════════════════════
async function fetchWiseComparison(targetCurrency) {
  try {
    const url = `https://api.wise.com/v4/comparisons/?sourceCurrency=KRW&targetCurrency=${targetCurrency}&sendAmount=${SEND_AMOUNT_KRW}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "RemittanceCompare/1.0",
        "Accept": "application/json",
      },
    });
    if (!resp.ok) {
      console.warn(`    ⚠️ Wise API ${resp.status} for ${targetCurrency}`);
      return null;
    }
    const data = await resp.json();
    return data;
  } catch (err) {
    console.warn(`    ⚠️ Wise API error for ${targetCurrency}: ${err.message}`);
    return null;
  }
}

function parseWiseData(wiseData, midRate, targetCurrency) {
  if (!wiseData?.providers) return [];

  return wiseData.providers
    .filter(p => p.quotes && p.quotes.length > 0)
    .map(p => {
      const q = p.quotes[0]; // first quote
      const fee = Math.round(q.fee || 0);
      const rate = q.rate || midRate;
      const receivedAmount = q.receivedAmount || 0;
      const unit = CURRENCY_META[targetCurrency]?.unit || 1;
      // appliedRate: how many KRW for 1 unit (or 100 for JPY) of foreign currency
      const appliedRate = unit === 1
        ? Math.round(SEND_AMOUNT_KRW / receivedAmount) || midRate
        : Math.round((SEND_AMOUNT_KRW / receivedAmount) * unit) || midRate;
      const spread = midRate > 0 ? +((((appliedRate / midRate) - 1) * 100).toFixed(3)) : 0;

      return {
        sourceId: p.alias || p.name?.toLowerCase().replace(/\s+/g, ""),
        name: p.name || p.alias,
        fee,
        spread: Math.max(0, spread),
        appliedRate,
        receivedAmount: +receivedAmount.toFixed(2),
        speed: q.formattedEstimatedDelivery || q.estimatedDelivery || "—",
        type: p.type || "unknown",
      };
    });
}

// ═══════════════════════════════════════════════
// 3. MOIN Quote API (모인 — 토스 포함)
//    공개 견적 API로 실시간 수수료/환율 조회
// ═══════════════════════════════════════════════
const MOIN_CURRENCY_TO_COUNTRY = {
  USD: "US", JPY: "JP", EUR: "DE", GBP: "GB",
  CNY: "CN", AUD: "AU", CAD: "CA", SGD: "SG",
};

async function fetchMoinQuoteSingle(targetCurrency, amount) {
  const country = MOIN_CURRENCY_TO_COUNTRY[targetCurrency];
  if (!country) return null;

  try {
    const resp = await fetch("https://web-api.ma.prd.themoin.com/v0/quote/ma", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.themoin.com",
      },
      body: JSON.stringify({
        targetCountry: country,
        targetCurrency: targetCurrency,
        fixedSide: "SEND",
        transferAmount: amount,
        couponTicketId: "",
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.ret !== "success" || !data.quoteV2) return null;
    return data;
  } catch {
    return null;
  }
}

/** 다중 금액 구간 MOIN 견적 조회 */
async function fetchMoinQuotes(targetCurrency) {
  const results = {};
  // 병렬 요청
  const promises = SEND_AMOUNTS.map(async (amount) => {
    const data = await fetchMoinQuoteSingle(targetCurrency, amount);
    if (data) results[amount] = data;
  });
  await Promise.all(promises);
  return Object.keys(results).length > 0 ? results : null;
}

function parseMoinTier(moinData, midRate, targetCurrency, sendAmount) {
  const q = moinData.quoteV2;
  const fee = Math.round(q.feeAmount?.amount || 0);
  const receivedAmount = q.destinationAmount?.amount || 0;
  const appliedRate = q.baseExchangeRate?.rate || 0;
  const unit = CURRENCY_META[targetCurrency]?.unit || 1;

  const appliedRateKRW = unit === 1
    ? Math.round(appliedRate)
    : Math.round(appliedRate * unit);

  const spread = midRate > 0
    ? +((((appliedRateKRW / midRate) - 1) * 100).toFixed(3))
    : 0;

  return {
    sendAmount,
    fee,
    fixedFee: Math.round(q.fixedFeeAmount?.amount || 0),
    flexibleFee: Math.round(q.flexibleFeeAmount?.amount || 0),
    feeRate: moinData.quoteFeeDetail?.feeRate || 0,
    spread: Math.max(0, spread),
    appliedRate: appliedRateKRW,
    receivedAmount: +receivedAmount.toFixed(2),
  };
}

// ═══════════════════════════════════════════════
// 4. 하나은행 환율 고시 (공개 API)
//    POST https://www.kebhana.com/cms/rate/wpfxd651_01i_01.do
// ═══════════════════════════════════════════════
const HANA_CURRENCY_MAP = {
  USD: "미국 USD", JPY: "일본 JPY (100)", EUR: "유로 EUR", GBP: "영국 GBP",
  CNY: "중국 CNY", AUD: "호주 AUD", CAD: "캐나다 CAD", SGD: "싱가포르 SGD",
};

async function fetchHanaRates() {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const resp = await fetch("https://www.kebhana.com/cms/rate/wpfxd651_01i_01.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://www.kebhana.com/cms/rate/wpfxd651_01i.do",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": "pbk_site=true",
      },
      body: `curCd=&inqStrDt=${today}&pbldDvCd=3&pbldSqn=&inqKindCd=1`,
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // 통화별 파싱: 통화명 → [현찰사실때, spread, 현찰파실때, spread, 송금보낼때, 송금받을때, 외화수표, 매매기준율, ...]
    const rates = {};
    for (const [cur, label] of Object.entries(HANA_CURRENCY_MAP)) {
      const idx = html.indexOf(label);
      if (idx === -1) continue;
      const chunk = html.slice(idx, idx + 800);
      const nums = [...chunk.matchAll(/class="txtAr">([\d,.]+)<\/td>/g)].map(m => parseFloat(m[1].replace(/,/g, "")));
      // nums: [현찰사실때, spread, 현찰파실때, spread, 송금보낼때(4), 송금받을때(5), 외화수표(6), 매매기준율(7), ...]
      if (nums.length >= 8) {
        rates[cur] = {
          midRate: nums[7],      // 매매기준율
          remitSend: nums[4],    // 송금 보낼때
          remitRecv: nums[5],    // 송금 받을때
        };
      }
    }
    return Object.keys(rates).length > 0 ? rates : null;
  } catch (err) {
    console.warn(`    ⚠️ Hana Bank API error: ${err.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════
// 5. SentBe API (oxygen.sentbe.com, CryptoJS AES)
// ═══════════════════════════════════════════════
import crypto from "crypto";

const SENTBE_KEY = "cXdqZmlvcWVqd2xd2pmam9pZaG9nZnFl";
const SENTBE_MAP = {
  USD: { country: 239, currency: 2 },  JPY: { country: 112, currency: 11 },
  EUR: { country: 83, currency: 19 },  GBP: { country: 237, currency: 17 },
  CNY: { country: 47, currency: 9 },   AUD: { country: 14, currency: 15 },
  CAD: { country: 41, currency: 16 },  SGD: { country: 201, currency: 21 },
};

function sentbeEvpKDF(password, salt) {
  const pass = Buffer.from(password, "utf-8");
  let derived = Buffer.alloc(0), block = Buffer.alloc(0);
  while (derived.length < 48) {
    block = crypto.createHash("md5").update(Buffer.concat([block, pass, salt])).digest();
    derived = Buffer.concat([derived, block]);
  }
  return { key: derived.slice(0, 32), iv: derived.slice(32, 48) };
}

function sentbeEncrypt(text) {
  const salt = crypto.randomBytes(8);
  const { key, iv } = sentbeEvpKDF(SENTBE_KEY, salt);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let enc = cipher.update(text, "utf8");
  enc = Buffer.concat([enc, cipher.final()]);
  return Buffer.concat([Buffer.from("Salted__"), salt, enc]).toString("base64");
}

function sentbeDecrypt(b64) {
  const data = Buffer.from(b64, "base64");
  const salt = data.slice(8, 16), ct = data.slice(16);
  const { key, iv } = sentbeEvpKDF(SENTBE_KEY, salt);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

async function fetchSentBeRates() {
  const results = {};
  for (const cur of CURRENCIES) {
    const m = SENTBE_MAP[cur];
    if (!m) continue;
    try {
      const payload = { platform: 1, pid: null, country: m.country, currency: m.currency, source_country: 209, source_currency: 1 };
      const encrypted = sentbeEncrypt(JSON.stringify(payload));
      const resp = await fetch("https://oxygen.sentbe.com/web/landing/page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", "Accept": "application/json",
          "Origin": "https://www.sentbe.com", "Referer": "https://www.sentbe.com/",
          "locale": "2", "platform": "1", "api_version": "1.94",
        },
        body: JSON.stringify({ data: encrypted }),
      });
      const respJson = await resp.json();
      if (typeof respJson.data === "string") {
        const dec = JSON.parse(sentbeDecrypt(respJson.data));
        const banks = (dec.delivery_method || []).filter(m => (m.label || "").toLowerCase().includes("bank"));
        results[cur] = {
          baseRate: dec.base_rate,
          expressFee: banks.find(m => m.fee?.fixed === 5000)?.fee?.fixed ?? 5000,
          standardFee: banks.find(m => m.fee?.fixed === 2500)?.fee?.fixed ?? 2500,
          feeRate: banks[0]?.fee?.rate ?? 0,
        };
      }
    } catch (err) {
      console.warn(`    ⚠️ SentBe ${cur}: ${err.message}`);
    }
  }
  return Object.keys(results).length > 0 ? results : null;
}

// ═══════════════════════════════════════════════
// 6. Korean service fixed fees (수동 관리)
//    API가 없는 한국 서비스의 고정 수수료
// ═══════════════════════════════════════════════
function loadFixedFees() {
  if (existsSync(FIXED_FEES_PATH)) {
    return JSON.parse(readFileSync(FIXED_FEES_PATH, "utf-8"));
  }
  return {};
}

// ═══════════════════════════════════════════════
// Merge: Wise API data + Korean fixed fees
// ═══════════════════════════════════════════════
function buildServiceList(wiseProviders, fixedFees, currency, midRate, moinQuotes, hanaRates, sentbeRates) {
  const unit = CURRENCY_META[currency]?.unit || 1;

  // Map of known service IDs
  const SERVICE_ALIASES = {
    wise: ["wise", "transferwise"],
    sentbe: ["sentbe", "센트비"],
    moin: ["moin", "모인"],
    wirebarley: ["wirebarley", "와이어바알리"],
    toss: ["toss", "토스"],
    hana: ["hana", "하나은행", "hana bank"],
    shinhan: ["shinhan", "신한은행", "shinhan bank"],
    paypal: ["paypal", "페이팔"],
  };

  const SERVICE_META = {
    wise: { name: "Wise", kr: "와이즈" },
    sentbe: { name: "SentBe", kr: "센트비" },
    moin: { name: "MOIN", kr: "모인" },
    wirebarley: { name: "WireBarley", kr: "와이어바알리" },
    toss: { name: "토스", kr: "토스" },
    hana: { name: "하나은행", kr: "하나은행" },
    shinhan: { name: "신한은행", kr: "신한은행" },
    paypal: { name: "PayPal", kr: "페이팔" },
  };

  const result = {};

  // Step 1: Add data from Wise Comparison API
  for (const wp of wiseProviders) {
    const alias = wp.sourceId?.toLowerCase() || "";
    let matchedId = null;
    for (const [id, aliases] of Object.entries(SERVICE_ALIASES)) {
      if (aliases.some(a => alias.includes(a) || a.includes(alias))) {
        matchedId = id;
        break;
      }
    }
    if (matchedId) {
      result[matchedId] = {
        id: matchedId,
        ...SERVICE_META[matchedId],
        supported: true,
        fee: wp.fee,
        spread: wp.spread,
        appliedRate: wp.appliedRate,
        speed: wp.speed,
        source: "wise-api",
        promotions: "",
        note: "",
      };
    }
  }

  // Step 1.5: Add MOIN live data (covers moin + toss) — 다중 금액 구간
  if (moinQuotes) {
    // 기본 표시용: DEFAULT_AMOUNT 구간
    const defaultQuote = moinQuotes[DEFAULT_AMOUNT];
    const defaultParsed = defaultQuote
      ? parseMoinTier(defaultQuote, midRate, currency, DEFAULT_AMOUNT)
      : null;

    // 전체 구간 tiers
    const tiers = {};
    for (const amount of SEND_AMOUNTS) {
      if (moinQuotes[amount]) {
        tiers[amount] = parseMoinTier(moinQuotes[amount], midRate, currency, amount);
      }
    }

    if (defaultParsed) {
      const baseSvc = {
        supported: true,
        fee: defaultParsed.fee,
        spread: defaultParsed.spread,
        appliedRate: defaultParsed.appliedRate,
        receivedAmount: defaultParsed.receivedAmount,
        speed: "수 시간~1일",
        source: "moin-api",
        tiers,
      };
      result["moin"] = {
        id: "moin", ...SERVICE_META["moin"], ...baseSvc,
        promotions: "",
        note: `수수료율 ${(defaultParsed.feeRate * 100).toFixed(1)}%`,
      };
      result["toss"] = {
        id: "toss", ...SERVICE_META["toss"], ...baseSvc,
        promotions: "",
        note: "모인 연동, 동일 환율",
      };
    }
  }

  // Step 1.7: Add Hana Bank live rate data
  if (hanaRates?.[currency]) {
    const h = hanaRates[currency];
    const spread = h.midRate > 0 ? +(((h.remitSend / h.midRate - 1) * 100).toFixed(3)) : 0;
    result["hana"] = {
      id: "hana",
      ...SERVICE_META["hana"],
      supported: true,
      fee: 13000,
      spread: Math.max(0, spread),
      appliedRate: Math.round(h.remitSend),
      speed: "1~3일",
      promotions: "인터넷뱅킹 환율우대 50%",
      note: `매매기준율 ₩${h.midRate.toLocaleString()}, 전신료 포함`,
      source: "hana-api",
    };
  }

  // Step 1.8: Add SentBe live rate data
  if (sentbeRates?.[currency]) {
    const sb = sentbeRates[currency];
    const appliedRateKRW = unit === 100 ? Math.round(sb.baseRate * unit) : Math.round(sb.baseRate);
    const spread = midRate > 0 ? +((appliedRateKRW / midRate - 1) * 100).toFixed(3) : 0;
    result["sentbe"] = {
      id: "sentbe",
      ...SERVICE_META["sentbe"],
      supported: true,
      fee: sb.standardFee || 2500,
      spread: Math.max(0, spread),
      appliedRate: appliedRateKRW,
      speed: "5분~2일",
      promotions: "",
      note: `스탠다드 ₩${sb.standardFee} / 익스프레스 ₩${sb.expressFee}`,
      source: "sentbe-api",
    };
  }

  // Step 2: Fill in missing services from fixed fees
  const curFixed = fixedFees[currency] || {};
  for (const [id, meta] of Object.entries(SERVICE_META)) {
    if (result[id]) {
      // Already from Wise/MOIN API - merge promotions/notes from fixed
      if (curFixed[id]) {
        if (!result[id].promotions) result[id].promotions = curFixed[id].promotions || "";
        if (!result[id].note) result[id].note = curFixed[id].note || "";
        // If API didn't return good data, use fixed
        if (result[id].fee === 0 && curFixed[id].fee > 0) {
          result[id].fee = curFixed[id].fee;
        }
      }
    } else if (curFixed[id]) {
      // Use fixed fees
      const f = curFixed[id];
      result[id] = {
        id,
        ...meta,
        supported: f.supported !== false,
        fee: f.fee || 0,
        spread: f.spread || 0,
        appliedRate: midRate > 0 ? Math.round(midRate * (1 + (f.spread || 0) / 100)) : 0,
        speed: f.speed || "—",
        promotions: f.promotions || "",
        note: f.note || "",
        source: "fixed",
      };
    } else {
      // No data at all — add with default
      result[id] = {
        id,
        ...meta,
        supported: true,
        fee: 5000,
        spread: 0.5,
        appliedRate: midRate > 0 ? Math.round(midRate * 1.005) : 0,
        speed: "—",
        promotions: "",
        note: "데이터 미확인",
        source: "default",
      };
    }
  }

  // Step 2.5: Generate tiers for fixed-fee services (if no API tiers)
  // 와이어바알리 금액 구간별 수수료 정책
  const WIREBARLEY_FEE_TIERS = [
    { max: 500000, fee: 5000 },
    { max: Infinity, fee: 0 },
  ];

  for (const svc of Object.values(result)) {
    if (svc.tiers || !svc.supported) continue;
    svc.tiers = {};
    for (const amount of SEND_AMOUNTS) {
      let tierFee = svc.fee;
      // 와이어바알리: 금액별 수수료 차등
      if (svc.id === "wirebarley") {
        tierFee = WIREBARLEY_FEE_TIERS.find(t => amount <= t.max)?.fee ?? 0;
      }
      const netKRW = amount - tierFee;
      const foreignAmt = svc.appliedRate > 0 ? +(netKRW / svc.appliedRate * unit).toFixed(2) : 0;
      const spreadCost = Math.round(amount * svc.spread / 100);
      svc.tiers[amount] = {
        sendAmount: amount,
        fee: tierFee,
        spread: svc.spread,
        appliedRate: svc.appliedRate,
        receivedAmount: foreignAmt,
        totalCost: tierFee + spreadCost,
      };
    }
  }

  // Step 3: Calculate totalCost and foreignAmount (기본 금액 기준)
  const services = Object.values(result).map(svc => {
    if (!svc.supported) return { ...svc, totalCost: null, foreignAmount: null };
    const netKRW = DEFAULT_AMOUNT - svc.fee;
    const foreignAmount = svc.appliedRate > 0 ? +(netKRW / svc.appliedRate * unit).toFixed(2) : 0;
    const spreadCost = Math.round(DEFAULT_AMOUNT * svc.spread / 100);
    const totalCost = svc.fee + spreadCost;
    return { ...svc, totalCost, foreignAmount };
  });

  // Sort by totalCost ascending
  services.sort((a, b) => {
    if (!a.supported) return 1;
    if (!b.supported) return -1;
    return (a.totalCost || Infinity) - (b.totalCost || Infinity);
  });

  return services;
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════
async function main() {
  const now = new Date();
  console.log("═══════════════════════════════════════════");
  console.log("  Remittance Fee Updater v3 (FREE $0)");
  console.log(`  ${now.toISOString()}`);
  console.log("═══════════════════════════════════════════");

  // Load existing data as fallback
  let existing = {};
  if (existsSync(OUT_PATH)) {
    try { existing = JSON.parse(readFileSync(OUT_PATH, "utf-8")); } catch {}
  }

  // Load fixed fees
  const fixedFees = loadFixedFees();

  // 1. Get mid-market rates
  let midRates;
  try {
    midRates = await fetchMidRates();
  } catch (err) {
    console.error("  ❌ Exchange rate API failed:", err.message);
    console.log("  📂 Using existing rates as fallback");
    midRates = {};
    if (existing.rates) {
      for (const [cur, data] of Object.entries(existing.rates)) {
        midRates[cur] = data.midRate;
      }
    }
  }

  // 2. For each currency, fetch data from all sources
  const rates = {};
  let successCount = 0;
  let hanaRates = null; // 하나은행: 한 번만 조회 (전 통화 포함)
  let sentbeRates = null; // 센드비: 한 번만 조회

  for (const currency of CURRENCIES) {
    const midRate = midRates[currency];
    if (!midRate) {
      console.log(`\n  ⚠️ ${currency}: No mid-rate, skipping`);
      if (existing.rates?.[currency]) {
        rates[currency] = { ...existing.rates[currency], stale: true };
      }
      continue;
    }

    console.log(`\n  🔍 ${CURRENCY_META[currency].flag} ${currency} (midRate: ₩${midRate.toLocaleString()})...`);

    // Fetch Hana + SentBe (1회만, 전 통화)
    if (!hanaRates) {
      hanaRates = await fetchHanaRates();
      if (hanaRates) {
        console.log(`    📡 하나은행: ${Object.keys(hanaRates).length} currencies loaded`);
      } else {
        console.log("    📂 하나은행: no data, using fixed fees");
      }
    }
    if (!sentbeRates) {
      sentbeRates = await fetchSentBeRates();
      if (sentbeRates) {
        console.log(`    📡 센드비: ${Object.keys(sentbeRates).length} currencies loaded`);
      } else {
        console.log("    📂 센드비: no data, using fixed fees");
      }
    }

    const [wiseData, moinData] = await Promise.all([
      fetchWiseComparison(currency),
      fetchMoinQuotes(currency),
    ]);
    const wiseProviders = wiseData ? parseWiseData(wiseData, midRate, currency) : [];

    if (wiseProviders.length > 0) {
      console.log(`    📡 Wise API: ${wiseProviders.length} providers found`);
      wiseProviders.forEach(p => console.log(`       - ${p.name}: fee ₩${p.fee}, spread ${p.spread}%, rate ₩${p.appliedRate}`));
    } else {
      console.log("    📂 Wise API: no data, using fixed fees only");
    }

    if (moinData) {
      const tierCount = Object.keys(moinData).length;
      const defaultQ = moinData[DEFAULT_AMOUNT]?.quoteV2;
      if (defaultQ) {
        console.log(`    📡 MOIN API: ${tierCount} tiers, 100만 기준 fee ₩${Math.round(defaultQ.feeAmount?.amount || 0)}, rate ${defaultQ.baseExchangeRate?.rate?.toFixed(2)}, received ${defaultQ.destinationAmount?.amount} ${currency}`);
      } else {
        console.log(`    📡 MOIN API: ${tierCount} tiers (default tier missing)`);
      }
    } else {
      console.log("    📂 MOIN API: no data, using fixed fees");
    }

    // Merge
    const services = buildServiceList(wiseProviders, fixedFees, currency, midRate, moinData, hanaRates, sentbeRates);
    console.log(`    ✅ ${services.filter(s => s.supported).length} services compiled`);

    rates[currency] = {
      midRate,
      fetchedAt: now.toISOString(),
      services,
    };
    successCount++;

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  // Build output
  const output = {
    updatedAt: now.toISOString(),
    schedule: "Daily 09:00 KST",
    source: "auto-free",
    sendAmounts: SEND_AMOUNTS,
    defaultAmount: DEFAULT_AMOUNT,
    stats: {
      total: CURRENCIES.length,
      success: successCount,
      failed: CURRENCIES.length - successCount,
    },
    currencies: CURRENCIES.map(c => ({
      code: c, ...CURRENCY_META[c],
    })),
    rates,
  };

  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

  // Worker KV에 센드비 데이터 업로드 (Worker에서 MD5 지원 안 되므로 배치에서 갱신)
  if (sentbeRates && process.env.CLOUDFLARE_API_TOKEN && process.env.CF_ACCOUNT_ID && process.env.CF_KV_NAMESPACE_ID) {
    try {
      const kvData = await fetch(`https://remittance-rates.remittance-app.workers.dev/api/rates`).then(r => r.json());
      kvData.sentbe = sentbeRates;
      kvData.updatedAt = now.toISOString();
      const putResp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}/values/live-rates`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify(kvData),
        }
      );
      if (putResp.ok) console.log("  📤 Worker KV: SentBe data uploaded");
      else console.warn("  ⚠️ Worker KV upload failed:", putResp.status);
    } catch (err) {
      console.warn("  ⚠️ Worker KV upload error:", err.message);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log(`  ✅ Done: ${successCount}/${CURRENCIES.length} currencies`);
  console.log(`  📝 ${OUT_PATH}`);
  console.log("═══════════════════════════════════════════");

  if (successCount === 0) {
    console.error("💀 All currencies failed!");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
