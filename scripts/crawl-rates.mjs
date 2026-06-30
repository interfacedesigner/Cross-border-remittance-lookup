#!/usr/bin/env node
/**
 * crawl-rates.mjs — Puppeteer 크롤링으로 환율 수집
 * 대상: 와이어바알리 (통화별 계산기 페이지)
 * 신한은행: 하나은행 API 스프레드 기반 추정 (SPA 인증 필요로 크롤링 불가)
 * 실행: node scripts/crawl-rates.mjs
 */
import puppeteer from "puppeteer";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXED_FEES_PATH = resolve(__dirname, "fixed-fees.json");

const CURRENCIES = ["USD", "JPY", "EUR", "GBP", "AUD", "CAD", "SGD"];
// CNY 제외 (와이어바알리 미지원)

const WB_PAGES = {
  USD: "krw-to-usd-rate",
  JPY: "krw-to-jpy-rate",
  EUR: "krw-to-eur-rate",
  GBP: "krw-to-gbp-rate",
  AUD: "krw-to-aud-rate",
  CAD: "krw-to-cad-rate",
  SGD: "krw-to-sgd-rate",
};

const CURRENCY_UNITS = { JPY: 100 };

// ═══════════════════════════════════════════════
// 와이어바알리: 통화별 계산기 페이지 크롤링
// ═══════════════════════════════════════════════
async function crawlWireBarley(browser) {
  console.log("\n📡 WireBarley 크롤링...");
  const results = {};
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  for (const cur of CURRENCIES) {
    const slug = WB_PAGES[cur];
    if (!slug) continue;
    try {
      await page.goto(`https://www.wirebarley.com/ko/kr/currency-converter/${slug}`, {
        waitUntil: "networkidle2",
        timeout: 20000,
      });
      await new Promise(r => setTimeout(r, 2000));

      const data = await page.evaluate((currency) => {
        const text = document.body.innerText;

        // "1 USD = 1,565.44 KRW" 또는 "100 JPY = 965.52 KRW"
        const rateMatch = text.match(new RegExp(`(\\d+)\\s*${currency}\\s*=\\s*([\\d,]+\\.?\\d*)\\s*KRW`, "i"));
        let rate = null;
        let rateUnit = 1;
        if (rateMatch) {
          rateUnit = parseInt(rateMatch[1]);
          rate = parseFloat(rateMatch[2].replace(/,/g, ""));
        }

        // 수취액: "638.80\nUSD" 또는 "103,571\nJPY"
        const receivedMatch = text.match(new RegExp(`([\\d,]+\\.?\\d*)\\s*\\n?\\s*${currency}`, "i"));
        const received = receivedMatch ? parseFloat(receivedMatch[1].replace(/,/g, "")) : null;

        return { rate, received, rateUnit };
      }, cur);

      if (data.rate) {
        results[cur] = { rate: data.rate, received: data.received, rateUnit: data.rateUnit || 1 };
        console.log(`  ✅ ${cur}: ${data.rateUnit} ${cur} = ₩${data.rate} (수취 ${data.received} ${cur})`);
      } else {
        console.log(`  ⚠️ ${cur}: 환율 추출 실패`);
      }
    } catch (err) {
      console.log(`  ❌ ${cur}: ${err.message}`);
    }
  }

  await page.close();
  return Object.keys(results).length > 0 ? results : null;
}

// ═══════════════════════════════════════════════
// 중간환율 + 스프레드 계산 → fixed-fees.json 업데이트
// ═══════════════════════════════════════════════
async function fetchMidRates() {
  const resp = await fetch("https://open.er-api.com/v6/latest/KRW");
  const data = await resp.json();
  if (data.result !== "success") return {};
  const rates = {};
  for (const cur of CURRENCIES) {
    const raw = data.rates[cur];
    if (raw) rates[cur] = Math.round((1 / raw) * (CURRENCY_UNITS[cur] || 1));
  }
  return rates;
}

function updateFixedFees(wirebarley, midRates) {
  const fixed = JSON.parse(readFileSync(FIXED_FEES_PATH, "utf-8"));
  let updated = false;

  for (const cur of CURRENCIES) {
    if (!fixed[cur]) continue;
    const mid = midRates[cur];

    if (wirebarley?.[cur]?.rate && mid) {
      const unit = CURRENCY_UNITS[cur] || 1;
      // rateUnit: 와이어바알리 페이지에서 표시하는 단위 (JPY는 100)
      const rateUnit = wirebarley[cur].rateUnit || 1;
      const wbRatePerUnit = wirebarley[cur].rate * (unit / rateUnit);
      const spread = +((wbRatePerUnit / mid - 1) * 100).toFixed(2);
      if (spread > 0 && spread < 10 && Math.abs(spread - fixed[cur].wirebarley.spread) > 0.05) {
        console.log(`  📝 wirebarley ${cur}: spread ${fixed[cur].wirebarley.spread}% → ${spread}%`);
        fixed[cur].wirebarley.spread = spread;
        updated = true;
      }
    }
  }

  if (updated) {
    fixed._lastManualUpdate = new Date().toISOString().slice(0, 10);
    writeFileSync(FIXED_FEES_PATH, JSON.stringify(fixed, null, 2) + "\n");
    console.log("  ✅ fixed-fees.json 업데이트 완료");
  } else {
    console.log("  ℹ️ 유의미한 변경 없음");
  }
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Rate Crawler (WireBarley via Puppeteer)");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const midRates = await fetchMidRates();
  console.log("  📊 Mid rates:", Object.entries(midRates).map(([k, v]) => `${k}:₩${v}`).join(" · "));

  const wirebarley = await crawlWireBarley(browser).catch(e => {
    console.log("  ❌ WireBarley 실패:", e.message);
    return null;
  });

  await browser.close();

  if (wirebarley) {
    updateFixedFees(wirebarley, midRates);
  }

  console.log("\n═══════════════════════════════════════════");
  console.log(`  WireBarley: ${wirebarley ? Object.keys(wirebarley).length + " currencies" : "failed"}`);
  console.log("═══════════════════════════════════════════");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
