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
// SentBe API (oxygen.sentbe.com, CryptoJS AES 암호화)
// ═══════════════════════════════════════════════
const SENTBE_KEY = "cXdqZmlvcWVqd2xd2pmam9pZaG9nZnFl";
const SENTBE_MAP = {
  USD: { country: 239, currency: 2 },  JPY: { country: 112, currency: 11 },
  EUR: { country: 83, currency: 19 },  GBP: { country: 237, currency: 17 },
  CNY: { country: 47, currency: 9 },   AUD: { country: 14, currency: 15 },
  CAD: { country: 41, currency: 16 },  SGD: { country: 201, currency: 21 },
};

// CryptoJS-compatible EVP KDF (MD5-based key derivation)
function md5(data) {
  // Simple MD5 for EVP KDF — using a minimal implementation
  // since Cloudflare Workers don't have node:crypto
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function add32(a, b) { return (a + b) & 0xFFFFFFFF; }

  const n = data.length;
  let state = [1732584193, -271733879, -1732584194, 271733878];
  let tail = [], i;
  for (i = 64; i <= n; i += 64) {
    const block = [];
    for (let j = i - 64; j < i; j += 4)
      block.push(data[j] | (data[j+1] << 8) | (data[j+2] << 16) | (data[j+3] << 24));
    md5cycle(state, block);
  }
  for (let j = i - 64; j < n; j++) tail.push(data[j]);
  tail.push(0x80);
  while (tail.length % 64 !== 56) tail.push(0);
  const bits = n * 8;
  tail.push(bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, (bits >> 24) & 0xff, 0, 0, 0, 0);
  const block = [];
  for (let j = 0; j < tail.length; j += 4)
    block.push(tail[j] | (tail[j+1] << 8) | (tail[j+2] << 16) | (tail[j+3] << 24));
  for (let j = 0; j < block.length; j += 16)
    md5cycle(state, block.slice(j, j + 16));
  const result = new Uint8Array(16);
  for (let j = 0; j < 4; j++) {
    result[j*4] = state[j] & 0xff; result[j*4+1] = (state[j] >> 8) & 0xff;
    result[j*4+2] = (state[j] >> 16) & 0xff; result[j*4+3] = (state[j] >> 24) & 0xff;
  }
  return result;
}

function evpKDF(password, salt) {
  const pass = new TextEncoder().encode(password);
  let derived = new Uint8Array(0);
  let block = new Uint8Array(0);
  while (derived.length < 48) {
    const input = new Uint8Array(block.length + pass.length + salt.length);
    input.set(block, 0); input.set(pass, block.length); input.set(salt, block.length + pass.length);
    block = md5(input);
    const next = new Uint8Array(derived.length + block.length);
    next.set(derived, 0); next.set(block, derived.length);
    derived = next;
  }
  return { key: derived.slice(0, 32), iv: derived.slice(32, 48) };
}

async function aesEncryptCJS(text, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(8));
  const { key, iv } = evpKDF(passphrase, salt);
  const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-CBC", false, ["encrypt"]);
  const enc = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, new TextEncoder().encode(text)));
  const prefix = new TextEncoder().encode("Salted__");
  const result = new Uint8Array(prefix.length + salt.length + enc.length);
  result.set(prefix, 0); result.set(salt, 8); result.set(enc, 16);
  return btoa(String.fromCharCode(...result));
}

async function aesDecryptCJS(b64, passphrase) {
  const data = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt = data.slice(8, 16);
  const ciphertext = data.slice(16);
  const { key, iv } = evpKDF(passphrase, salt);
  const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-CBC", false, ["decrypt"]);
  const dec = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(dec);
}

async function fetchSentBeRates() {
  const results = {};
  for (const cur of CURRENCIES) {
    const m = SENTBE_MAP[cur];
    if (!m) continue;
    try {
      const payload = { platform: 1, pid: null, country: m.country, currency: m.currency, source_country: 209, source_currency: 1 };
      const encrypted = await aesEncryptCJS(JSON.stringify(payload), SENTBE_KEY);
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
        const decrypted = JSON.parse(await aesDecryptCJS(respJson.data, SENTBE_KEY));
        const bankMethods = (decrypted.delivery_method || []).filter(m => (m.label || "").toLowerCase().includes("bank"));
        const express = bankMethods.find(m => m.fee?.fixed === 5000) || bankMethods[0];
        const standard = bankMethods.find(m => m.fee?.fixed === 2500);
        results[cur] = {
          baseRate: decrypted.base_rate,
          usdRate: decrypted.usd_rate,
          expressFee: express?.fee?.fixed || 5000,
          standardFee: standard?.fee?.fixed || 2500,
          feeRate: express?.fee?.rate || 0,
          methods: (decrypted.delivery_method || []).map(m => ({ label: m.label, fee: m.fee?.fixed, feeRate: m.fee?.rate })),
        };
      }
    } catch { /* skip */ }
  }
  return Object.keys(results).length > 0 ? results : null;
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
    // SentBe: AES+MD5 EVP KDF는 Worker에서 불안정 → 별도 cron으로 갱신
    const existingData = await env.RATES_KV.get(KV_KEY, "json");
    const sentbe = existingData?.sentbe || {};

    const data = {
      updatedAt: new Date().toISOString(),
      moin: moin || {},
      hana: hana || {},
      sentbe: sentbe || {},
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

    console.log(`✅ KV updated: MOIN ${Object.keys(moin || {}).length}, Hana ${Object.keys(hana || {}).length}, SentBe ${Object.keys(sentbe || {}).length} currencies`);
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
          sentbe: { [curFilter]: cached.sentbe?.[curFilter] || {} },
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
