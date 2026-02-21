#!/usr/bin/env node
/**
 * update-fees.mjs — 완전 무료 자동 업데이트 ($0)
 * ─────────────────────────────────────────────────
 * 1. 환율: open.er-api.com (무료, API키 불필요)
 * 2. 수수료: Wise Comparison API (무료, 인증 불필요)
 *    + 한국 서비스 수수료 고정값 (월 1-2회 수동 갱신)
 * 3. GitHub Actions cron 화/목 09:00 KST
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

const SEND_AMOUNT_KRW = 1000000; // 기준 100만원

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
// 3. Korean service fixed fees (수동 관리)
//    스크래핑이 불가능한 한국 서비스의 고정 수수료
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
function buildServiceList(wiseProviders, fixedFees, currency, midRate) {
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

  // Step 2: Fill in missing services from fixed fees
  const curFixed = fixedFees[currency] || {};
  for (const [id, meta] of Object.entries(SERVICE_META)) {
    if (result[id]) {
      // Already from Wise API - merge promotions/notes from fixed
      if (curFixed[id]) {
        result[id].promotions = curFixed[id].promotions || "";
        result[id].note = curFixed[id].note || "";
        // If Wise API didn't return good data, use fixed
        if (result[id].fee === 0 && curFixed[id].fee > 0) {
          result[id].fee = curFixed[id].fee;
        }
      }
      result[id].source = "wise-api";
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

  // Step 3: Calculate totalCost and foreignAmount
  const services = Object.values(result).map(svc => {
    if (!svc.supported) return { ...svc, totalCost: null, foreignAmount: null };
    const netKRW = SEND_AMOUNT_KRW - svc.fee;
    const foreignAmount = svc.appliedRate > 0 ? +(netKRW / svc.appliedRate * unit).toFixed(2) : 0;
    const spreadCost = Math.round(SEND_AMOUNT_KRW * svc.spread / 100);
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

  // 2. For each currency, fetch Wise comparison + merge with fixed fees
  const rates = {};
  let successCount = 0;

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

    // Fetch Wise comparison data
    const wiseData = await fetchWiseComparison(currency);
    const wiseProviders = wiseData ? parseWiseData(wiseData, midRate, currency) : [];

    if (wiseProviders.length > 0) {
      console.log(`    📡 Wise API: ${wiseProviders.length} providers found`);
      wiseProviders.forEach(p => console.log(`       - ${p.name}: fee ₩${p.fee}, spread ${p.spread}%, rate ₩${p.appliedRate}`));
    } else {
      console.log("    📂 Wise API: no data, using fixed fees only");
    }

    // Merge
    const services = buildServiceList(wiseProviders, fixedFees, currency, midRate);
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
    schedule: "Tue/Thu 09:00 KST",
    source: "auto-free",
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
