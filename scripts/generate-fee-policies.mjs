#!/usr/bin/env node
/**
 * generate-fee-policies.mjs
 * fixed-fees.json → public/fee-policies.json
 * 클라이언트가 실시간 환율에 적용할 수수료 정책 생성
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXED = JSON.parse(readFileSync(resolve(__dirname, "fixed-fees.json"), "utf-8"));
const OUT = resolve(__dirname, "../public/fee-policies.json");

const SERVICES = {
  sentbe: { name: "SentBe", kr: "센트비" },
  wirebarley: { name: "WireBarley", kr: "와이어바알리" },
  shinhan: { name: "신한은행", kr: "신한은행" },
  // moin, toss, hana: Worker에서 실시간 제공, 폴백용
  moin: { name: "MOIN", kr: "모인" },
  toss: { name: "토스", kr: "토스" },
  hana: { name: "하나은행", kr: "하나은행" },
  wise: { name: "Wise", kr: "와이즈" },
  paypal: { name: "PayPal", kr: "페이팔" },
};

const policies = {
  version: 2,
  updatedAt: FIXED._lastManualUpdate,
  sendAmounts: [300000, 1000000, 3000000, 5000000, 10000000],
  services: {},
};

for (const [id, meta] of Object.entries(SERVICES)) {
  const svc = { ...meta, currencies: {} };

  for (const [cur, curData] of Object.entries(FIXED)) {
    if (cur.startsWith("_")) continue;
    const f = curData[id];
    if (!f) continue;
    svc.currencies[cur] = {
      supported: f.supported !== false,
      fee: f.fee || 0,
      spread: f.spread || 0,
      speed: f.speed || "—",
      promotions: f.promotions || "",
      note: f.note || "",
    };
  }

  // 와이어바알리 금액별 수수료
  if (id === "wirebarley") {
    svc.feeTiers = [
      { max: 500000, fee: 5000 },
      { max: null, fee: 0 },
    ];
  }

  policies.services[id] = svc;
}

writeFileSync(OUT, JSON.stringify(policies, null, 2));
console.log(`✅ fee-policies.json generated (${Object.keys(policies.services).length} services)`);
