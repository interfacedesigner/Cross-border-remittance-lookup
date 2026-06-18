/**
 * Cloudflare Worker — 실시간 환율 프록시
 *
 * Cron (every 5 min): MOIN API (40 calls) + 하나은행 (1 call) → KV 저장
 * GET /api/rates: KV에서 최신 데이터 읽어 CORS 응답
 */

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════
const SEND_AMOUNTS = [300000, 1000000, 3000000, 5000000, 10000000];
const CURRENCIES = ["USD", "JPY", "EUR", "GBP", "CNY", "AUD", "CAD", "SGD"];
const MOIN_COUNTRY = {
  USD: "US", JPY: "JP", EUR: "DE", GBP: "GB",
  CNY: "CN", AUD: "AU", CAD: "CA", SGD: "SG",
};
const HANA_LABELS = {
  USD: "미국 USD", JPY: "일본 JPY (100)", EUR: "유로 EUR", GBP: "영국 GBP",
  CNY: "중국 CNY", AUD: "호주 AUD", CAD: "캐나다 CAD", SGD: "싱가포르 SGD",
};
const KV_KEY = "live-rates";
const KV_DAILY_PREFIX = "daily:"; // daily:2026-06-17 → {USD:1448,JPY:955,...}
const FETCH_TIMEOUT = 8000;

// ═══════════════════════════════════════════════
// MOIN API
// ═══════════════════════════════════════════════
async function fetchMoinQuote(currency, amount) {
  const country = MOIN_COUNTRY[currency];
  if (!country) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const resp = await fetch("https://web-api.ma.prd.themoin.com/v0/quote/ma", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "https://www.themoin.com" },
      body: JSON.stringify({
        targetCountry: country, targetCurrency: currency,
        fixedSide: "SEND", transferAmount: amount, couponTicketId: "",
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.ret !== "success" || !data.quoteV2) return null;
    const q = data.quoteV2;
    return {
      fee: Math.round(q.feeAmount?.amount || 0),
      fixedFee: Math.round(q.fixedFeeAmount?.amount || 0),
      flexibleFee: Math.round(q.flexibleFeeAmount?.amount || 0),
      feeRate: data.quoteFeeDetail?.feeRate || 0,
      appliedRate: q.baseExchangeRate?.rate || 0,
      receivedAmount: q.destinationAmount?.amount || 0,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function fetchAllMoinQuotes() {
  const result = {};
  // 8 currencies × 5 amounts = 40 calls, batched in groups of 10
  const tasks = [];
  for (const cur of CURRENCIES) {
    result[cur] = {};
    for (const amt of SEND_AMOUNTS) {
      tasks.push({ cur, amt });
    }
  }

  // Process in batches of 10 to avoid overwhelming the API
  for (let i = 0; i < tasks.length; i += 10) {
    const batch = tasks.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(({ cur, amt }) => fetchMoinQuote(cur, amt).then(r => ({ cur, amt, r })))
    );
    for (const { cur, amt, r } of results) {
      if (r) result[cur][amt] = r;
    }
  }
  return result;
}

// ═══════════════════════════════════════════════
// 하나은행 API
// ═══════════════════════════════════════════════
async function fetchHanaRates() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const resp = await fetch("https://www.kebhana.com/cms/rate/wpfxd651_01i_01.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://www.kebhana.com/cms/rate/wpfxd651_01i.do",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": "pbk_site=true",
      },
      body: `curCd=&inqStrDt=${today}&pbldDvCd=3&pbldSqn=&inqKindCd=1`,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const html = await resp.text();

    const rates = {};
    for (const [cur, label] of Object.entries(HANA_LABELS)) {
      const idx = html.indexOf(label);
      if (idx === -1) continue;
      const chunk = html.slice(idx, idx + 800);
      const nums = [...chunk.matchAll(/class="txtAr">([\d,.]+)<\/td>/g)]
        .map(m => parseFloat(m[1].replace(/,/g, "")));
      if (nums.length >= 8) {
        rates[cur] = {
          midRate: nums[7],
          remitSend: nums[4],
          remitRecv: nums[5],
        };
      }
    }
    return Object.keys(rates).length > 0 ? rates : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ═══════════════════════════════════════════════
// CORS helpers
// ═══════════════════════════════════════════════
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ═══════════════════════════════════════════════
// Handlers
// ═══════════════════════════════════════════════
export default {
  /** Cron Trigger: 5분마다 MOIN + 하나은행 데이터 수집 → KV 저장 + 일별 스냅샷 */
  async scheduled(event, env, ctx) {
    console.log("⏰ Cron triggered:", new Date().toISOString());

    const [moin, hana] = await Promise.all([
      fetchAllMoinQuotes(),
      fetchHanaRates(),
    ]);

    const data = {
      updatedAt: new Date().toISOString(),
      moin: moin || {},
      hana: hana || {},
    };

    await env.RATES_KV.put(KV_KEY, JSON.stringify(data), {
      expirationTtl: 600, // 10분 TTL (안전장치)
    });

    // ── 일별 스냅샷 저장 (하루 1회, 중간환율 기준) ──
    const today = new Date().toISOString().slice(0, 10);
    const dailyKey = KV_DAILY_PREFIX + today;
    const existing = await env.RATES_KV.get(dailyKey, "json");
    if (!existing && hana && Object.keys(hana).length > 0) {
      const snapshot = {};
      for (const cur of CURRENCIES) {
        if (hana[cur]?.midRate) {
          snapshot[cur] = Math.round(hana[cur].midRate);
        } else if (moin[cur]?.[1000000]?.appliedRate) {
          snapshot[cur] = Math.round(moin[cur][1000000].appliedRate);
        }
      }
      if (Object.keys(snapshot).length > 0) {
        await env.RATES_KV.put(dailyKey, JSON.stringify({ date: today, rates: snapshot }), {
          expirationTtl: 86400 * 100, // 100일 보관
        });
        console.log(`📸 Daily snapshot saved: ${today} → ${Object.keys(snapshot).length} currencies`);
      }
    }

    console.log(`✅ KV updated: MOIN ${Object.keys(moin || {}).length} currencies, Hana ${Object.keys(hana || {}).length} currencies`);
  },

  /** HTTP: GET /api/rates → KV에서 읽어 CORS 응답 */
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/api/rates") {
      const cached = await env.RATES_KV.get(KV_KEY, "json");
      if (!cached) {
        return jsonResponse({ error: "No data yet", updatedAt: null }, 503);
      }

      // Optional currency filter
      const curFilter = url.searchParams.get("currency");
      if (curFilter && CURRENCIES.includes(curFilter)) {
        return jsonResponse({
          updatedAt: cached.updatedAt,
          moin: { [curFilter]: cached.moin?.[curFilter] || {} },
          hana: { [curFilter]: cached.hana?.[curFilter] || {} },
        });
      }

      return jsonResponse(cached);
    }

    // ── 일별 히스토리 API ──
    if (url.pathname === "/api/history") {
      const currency = url.searchParams.get("currency") || "USD";
      const days = Math.min(parseInt(url.searchParams.get("days") || "90"), 100);

      if (!CURRENCIES.includes(currency)) {
        return jsonResponse({ error: "Invalid currency" }, 400);
      }

      const results = [];
      const now = new Date();
      const promises = [];

      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        // Skip weekends (no market data)
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;
        promises.push(
          env.RATES_KV.get(KV_DAILY_PREFIX + dateStr, "json").then((v) => {
            if (v?.rates?.[currency]) {
              results.push({ d: v.date, r: v.rates[currency] });
            }
          })
        );
      }

      await Promise.all(promises);
      results.sort((a, b) => a.d.localeCompare(b.d));

      return jsonResponse({
        currency,
        days,
        count: results.length,
        data: results,
      });
    }

    if (url.pathname === "/api/health") {
      const cached = await env.RATES_KV.get(KV_KEY, "json");
      const today = new Date().toISOString().slice(0, 10);
      const dailySnap = await env.RATES_KV.get(KV_DAILY_PREFIX + today, "json");
      return jsonResponse({
        status: "ok",
        lastUpdate: cached?.updatedAt || null,
        currencies: Object.keys(cached?.moin || {}),
        dailySnapshot: dailySnap ? today : null,
      });
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
