/**
 * rateFetcher.js — 실시간 환율 + 서비스 견적 통합 모듈
 *
 * 데이터 소스 우선순위:
 *   1. open.er-api.com → 중간환율 (CORS OK, 직접 호출)
 *   2. Cloudflare Worker → MOIN + 하나은행 실시간 견적
 *   3. fee-policies.json → 고정 수수료 정책 (센드비, 와이어바알리, 신한)
 *   4. fee-data.json → 폴백 (배치 생성 데이터)
 */

import { CURRENCIES } from "./constants";
import { RATE_CACHE_TTL } from "../styles/theme";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "";
const SEND_AMOUNTS = [300000, 1000000, 3000000, 5000000, 10000000];

// ═══════════════════════════════════════════════
// Caches
// ═══════════════════════════════════════════════
let midRateCache = { rates: null, time: 0 };
let workerCache = { data: null, time: 0 };
let feePolicies = null;

// ═══════════════════════════════════════════════
// 1. 중간환율 (open.er-api.com, CORS OK)
// ═══════════════════════════════════════════════
export async function fetchMidRates() {
  if (midRateCache.rates && Date.now() - midRateCache.time < RATE_CACHE_TTL) {
    return midRateCache.rates;
  }
  const resp = await fetch("https://open.er-api.com/v6/latest/KRW");
  if (!resp.ok) throw new Error("Mid-rate API HTTP " + resp.status);
  const data = await resp.json();
  if (data.result !== "success") throw new Error(data["error-type"]);

  const rates = {};
  for (const [code, info] of Object.entries(CURRENCIES)) {
    const rawRate = data.rates[code];
    if (!rawRate) continue;
    rates[code] = Math.round((1 / rawRate) * (info.unit || 1));
  }
  midRateCache = { rates, time: Date.now() };
  return rates;
}

// ═══════════════════════════════════════════════
// 2. Worker 데이터 (MOIN + 하나은행)
// ═══════════════════════════════════════════════
export async function fetchWorkerRates() {
  if (!WORKER_URL) return null;
  if (workerCache.data && Date.now() - workerCache.time < RATE_CACHE_TTL) {
    return workerCache.data;
  }
  try {
    const resp = await fetch(`${WORKER_URL}/api/rates`, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    workerCache = { data, time: Date.now() };
    return data;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════
// 3. 수수료 정책 (정적 JSON, 1회 로드)
// ═══════════════════════════════════════════════
export async function loadFeePolicies() {
  if (feePolicies) return feePolicies;
  try {
    const resp = await fetch("/fee-policies.json?" + Date.now());
    if (!resp.ok) return null;
    feePolicies = await resp.json();
    return feePolicies;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════
// 비교 결과 계산
// ═══════════════════════════════════════════════
function getWirebarleyFee(amount, policies) {
  const tiers = policies?.services?.wirebarley?.feeTiers;
  if (!tiers) return 0;
  const tier = tiers.find(t => t.max === null || amount <= t.max);
  return tier?.fee ?? 0;
}

export function computeComparison(currency, amount, midRate, workerData, policies) {
  const unit = CURRENCIES[currency]?.unit || 1;
  const services = [];

  // Helper: 서비스 결과 계산
  const addService = (id, name, kr, { fee, spread, appliedRate, speed, promotions, note, source }) => {
    const effectiveRate = appliedRate || Math.round(midRate * (1 + spread / 100));
    const netKRW = amount - fee;
    const foreignAmount = netKRW > 0 && effectiveRate > 0 ? +(netKRW / effectiveRate * unit).toFixed(2) : 0;
    const spreadCost = Math.round(amount * spread / 100);
    const totalCost = fee + spreadCost;

    services.push({
      id, name, kr, fee, spread, appliedRate: effectiveRate,
      totalCost, foreignAmount, speed, promotions: promotions || "",
      note: note || "", source,
    });
  };

  // ── MOIN (Worker 실시간) ──
  const moinData = workerData?.moin?.[currency]?.[amount];
  if (moinData) {
    const moinRate = Math.round(moinData.appliedRate * (unit === 100 ? unit : 1));
    const spread = midRate > 0 ? +((moinRate / midRate - 1) * 100).toFixed(3) : 0;
    addService("moin", "MOIN", "모인", {
      fee: moinData.fee, spread: Math.max(0, spread), appliedRate: moinRate,
      speed: "수 시간~1일", source: "live",
      note: `수수료율 ${(moinData.feeRate * 100).toFixed(1)}%`,
    });
    // 토스 = 모인 동일
    addService("toss", "토스", "토스", {
      fee: moinData.fee, spread: Math.max(0, spread), appliedRate: moinRate,
      speed: "수 시간~1일", source: "live", note: "모인 연동",
    });
  }

  // ── 하나은행 (Worker 실시간) ──
  const hanaData = workerData?.hana?.[currency];
  if (hanaData) {
    const spread = hanaData.midRate > 0
      ? +((hanaData.remitSend / hanaData.midRate - 1) * 100).toFixed(3) : 0;
    addService("hana", "하나은행", "하나은행", {
      fee: 13000, spread: Math.max(0, spread), appliedRate: Math.round(hanaData.remitSend),
      speed: "1~3일", source: "live",
      note: `매매기준율 ₩${hanaData.midRate.toLocaleString()}`,
    });
  }

  // ── 고정 정책 서비스 (센드비, 와이어바알리, 신한, wise, paypal) ──
  const fixedServices = ["sentbe", "wirebarley", "shinhan", "wise", "paypal"];
  // moin, toss, hana: Worker에서 없으면 폴백
  if (!moinData) fixedServices.push("moin", "toss");
  if (!hanaData) fixedServices.push("hana");

  for (const id of fixedServices) {
    const svc = policies?.services?.[id];
    if (!svc) continue;
    const curPolicy = svc.currencies?.[currency];
    if (!curPolicy || !curPolicy.supported) continue;

    let fee = curPolicy.fee;
    if (id === "wirebarley") fee = getWirebarleyFee(amount, policies);

    addService(id, svc.name, svc.kr, {
      fee,
      spread: curPolicy.spread,
      speed: curPolicy.speed,
      promotions: curPolicy.promotions,
      note: curPolicy.note,
      source: "policy",
    });
  }

  // 중복 제거 (같은 id가 이미 있으면 skip)
  const seen = new Set();
  const unique = services.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  unique.sort((a, b) => a.totalCost - b.totalCost);
  return unique;
}

// ═══════════════════════════════════════════════
// 통합 호출
// ═══════════════════════════════════════════════
export async function fetchAllAndCompute(currency, amount) {
  const [midRates, workerData, policies] = await Promise.all([
    fetchMidRates().catch(() => null),
    fetchWorkerRates(),
    loadFeePolicies(),
  ]);

  const midRate = midRates?.[currency];
  const sources = {
    midRate: midRates ? "live" : "fallback",
    worker: workerData ? "live" : "unavailable",
  };

  return { midRate, sources, workerUpdatedAt: workerData?.updatedAt || null,
    services: midRate ? computeComparison(currency, amount, midRate, workerData, policies) : [],
  };
}
