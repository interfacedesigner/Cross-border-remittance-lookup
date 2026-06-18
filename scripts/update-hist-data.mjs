#!/usr/bin/env node
/**
 * update-hist-data.mjs — histData.js 월별 환율 자동 갱신
 *
 * - 현재 월의 환율을 API에서 가져와 histData.js에 추가/갱신
 * - GitHub Actions에서 매일 실행, 새 월이면 자동 추가
 * - 기존 월 데이터는 최신 환율로 갱신 (월말에 확정)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HIST_PATH = path.join(__dirname, "..", "src", "utils", "histData.js");

const CURRENCIES = {
  USD: { unit: 1 },
  JPY: { unit: 100 },
  EUR: { unit: 1 },
  GBP: { unit: 1 },
  CNY: { unit: 1 },
  AUD: { unit: 1 },
  CAD: { unit: 1 },
  SGD: { unit: 1 },
};

async function fetchCurrentRates() {
  const resp = await fetch("https://open.er-api.com/v6/latest/KRW");
  if (!resp.ok) throw new Error("API HTTP " + resp.status);
  const data = await resp.json();
  if (data.result !== "success") throw new Error(data["error-type"] || "Unknown");

  const rates = {};
  for (const [code, info] of Object.entries(CURRENCIES)) {
    const raw = data.rates[code];
    if (raw) rates[code] = Math.round((1 / raw) * info.unit);
  }
  return rates;
}

function parseHistData(content) {
  // export const HIST={USD:[...],JPY:[...],...};
  const match = content.match(/export\s+const\s+HIST\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) throw new Error("Cannot parse histData.js format");
  return new Function(`return ${match[1]}`)();
}

function serializeHistData(hist) {
  const header = [
    "// Historical monthly exchange rate data (auto-updated)",
    "// Updated by scripts/update-hist-data.mjs",
  ].join("\n");

  const codes = Object.keys(hist);
  const entries = codes.map((code) => {
    const arr = hist[code].map((e) => `{d:"${e.d}",r:${e.r}}`).join(",");
    return `${code}:[${arr}]`;
  });

  return `${header}\nexport const HIST={${entries.join(",")}};\n`;
}

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;

  console.log(`[hist-update] 🗓️  Current month: ${currentMonth}`);

  // Read & parse existing
  const content = fs.readFileSync(HIST_PATH, "utf-8");
  const hist = parseHistData(content);

  const usdLast = hist.USD?.[hist.USD.length - 1]?.d;
  console.log(`[hist-update] Last entry: ${usdLast}`);

  // Fill any missing months between last entry and current
  const missingMonths = [];
  if (usdLast) {
    const [ly, lm] = usdLast.split("-").map(Number);
    let y = ly, m = lm;
    while (true) {
      m++;
      if (m > 12) { m = 1; y++; }
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (key > currentMonth) break;
      missingMonths.push(key);
    }
  }

  if (missingMonths.length === 0 && usdLast === currentMonth) {
    console.log("[hist-update] Current month already exists, will update rate");
  } else if (missingMonths.length > 0) {
    console.log(`[hist-update] Missing months to fill: ${missingMonths.join(", ")}`);
  }

  // Fetch live rates
  const rates = await fetchCurrentRates();
  console.log("[hist-update] Live rates:", JSON.stringify(rates));

  let updated = false;

  for (const [code, rate] of Object.entries(rates)) {
    if (!hist[code]) continue;
    const arr = hist[code];
    const last = arr[arr.length - 1];

    // Fill missing intermediate months with interpolated values
    if (missingMonths.length > 1 && last) {
      const startRate = last.r;
      const step = (rate - startRate) / missingMonths.length;
      for (let i = 0; i < missingMonths.length - 1; i++) {
        const mKey = missingMonths[i];
        if (!arr.some((e) => e.d === mKey)) {
          const interpolated = Math.round(startRate + step * (i + 1));
          arr.push({ d: mKey, r: interpolated });
          updated = true;
        }
      }
    }

    // Add or update current month
    const existing = arr.find((e) => e.d === currentMonth);
    if (existing) {
      if (existing.r !== rate) {
        existing.r = rate;
        updated = true;
      }
    } else {
      arr.push({ d: currentMonth, r: rate });
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(HIST_PATH, serializeHistData(hist));
    console.log("[hist-update] ✅ histData.js updated successfully");
  } else {
    console.log("[hist-update] ℹ️  No changes needed");
  }
}

main().catch((err) => {
  console.error("[hist-update] ❌ Error:", err.message);
  process.exit(1);
});
