import { useState, useCallback, useEffect } from "react";

const SUPPORTED = ["ko", "en", "ja"];
const STORAGE_KEY = "app-lang";

function detectLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;
  const nav = navigator.language?.slice(0, 2) || "ko";
  if (SUPPORTED.includes(nav)) return nav;
  return "ko";
}

const LANG_META = {
  ko: { label: "KR", flag: "🇰🇷", name: "한국어" },
  en: { label: "EN", flag: "🇺🇸", name: "English" },
  ja: { label: "JP", flag: "🇯🇵", name: "日本語" },
};

// ═══════════════════════════════════════════════
// 번역 사전
// ═══════════════════════════════════════════════
const dict = {
  // ── 헤더 ──
  "header.title": { ko: "해외송금 공정 비교", en: "Fair Remittance Compare", ja: "海外送金 公正比較" },
  "header.subtitle": { ko: "실시간 · 8개 서비스 · 편향 없음", en: "Real-time · 8 services · Unbiased", ja: "リアルタイム · 8サービス · 公平" },
  "header.appDownload": { ko: "앱 다운로드", en: "Get App", ja: "アプリ" },

  // ── 탭 ──
  "tab.compare": { ko: "실시간 공정비교", en: "Compare", ja: "リアルタイム比較" },
  "tab.rate": { ko: "환율 분석", en: "Rate Analysis", ja: "為替分析" },
  "tab.timing": { ko: "적정시기", en: "Best Timing", ja: "最適時期" },
  "tab.multi": { ko: "다중 통화", en: "Multi-Currency", ja: "多通貨" },

  // ── 비교 탭 ──
  "compare.currency": { ko: "수취 통화", en: "Receive Currency", ja: "受取通貨" },
  "compare.currencySelect": { ko: "수취 통화 선택", en: "Select Currency", ja: "通貨を選択" },
  "compare.amount": { ko: "송금 금액", en: "Send Amount", ja: "送金額" },
  "compare.btn.compare": { ko: "실시간 비교", en: "Compare Now", ja: "リアルタイム比較" },
  "compare.btn.loading": { ko: "로딩 중...", en: "Loading...", ja: "読み込み中..." },
  "compare.btn.fetching": { ko: "환율 조회 중...", en: "Fetching rates...", ja: "為替照会中..." },
  "compare.btn.enterAmount": { ko: "금액을 입력하세요", en: "Enter amount", ja: "金額を入力" },
  "compare.status.fetching": { ko: "조회 중...", en: "Fetching...", ja: "照会中..." },
  "compare.status.live": { ko: "실시간 환율", en: "Live rates", ja: "リアルタイム為替" },
  "compare.status.cached": { ko: "저장 환율", en: "Cached rates", ja: "キャッシュ為替" },
  "compare.status.error": { ko: "데이터 없음", en: "No data", ja: "データなし" },
  "compare.status.idle": { ko: "대기", en: "Idle", ja: "待機" },
  "compare.received": { ko: "실수령", en: "You receive", ja: "受取額" },
  "compare.fee": { ko: "수수료", en: "Fee", ja: "手数料" },
  "compare.feeWaived": { ko: "무료", en: "Free", ja: "無料" },
  "compare.spread": { ko: "스프레드", en: "Spread", ja: "スプレッド" },
  "compare.available": { ko: "신청가능", en: "Available", ja: "申請可能" },
  "compare.bizOnly": { ko: "영업일만", en: "Business days", ja: "営業日のみ" },
  "compare.savings": { ko: "이용 시 최대", en: "Save up to", ja: "最大節約" },
  "compare.savingsVs": { ko: "대비", en: "vs", ja: "と比較して" },
  "compare.moreReceived": { ko: "더 수령", en: "more received", ja: "追加受取" },
  "compare.receivedCompare": { ko: "실수령 비교", en: "Received Amount Comparison", ja: "受取額比較" },
  "compare.emptyLoading": { ko: "데이터 로딩 중...", en: "Loading data...", ja: "データ読み込み中..." },
  "compare.emptyNoData": { ko: "데이터 없음", en: "No data", ja: "データなし" },
  "compare.emptyAction": { ko: "금액 입력 후 비교 버튼을 눌러주세요", en: "Enter amount and tap Compare", ja: "金額を入力して比較ボタンを押してください" },
  "compare.disclaimer": {
    ko: "※ 환율은 조회 시점 실시간, 수수료는 자동 갱신 기반. 실제 금액은 각 서비스에서 확인하세요.",
    en: "※ Rates are real-time at query. Fees auto-updated. Verify actual amounts on each service.",
    ja: "※ 為替はリアルタイム、手数料は自動更新。実際の金額は各サービスでご確認ください。",
  },
  "compare.noRecommendation": {
    ko: "특정 서비스를 추천하지 않습니다.",
    en: "We do not recommend any specific service.",
    ja: "特定のサービスを推奨しません。",
  },
  "compare.bizDayNote": { ko: "핀테크: 신청 가능 (처리는 영업일) · 🔴 은행: 영업일만", en: "Fintech: Available (processed on business days) · Banks: Business days only", ja: "フィンテック: 申請可能 (処理は営業日) · 銀行: 営業日のみ" },

  // ── 환율 분석 탭 ──
  "rate.dailyTitle": { ko: "최근 일별 환율 추이", en: "Recent Daily Rate Trend", ja: "最近の日別為替推移" },
  "rate.1m": { ko: "1개월", en: "1M", ja: "1ヶ月" },
  "rate.2m": { ko: "2개월", en: "2M", ja: "2ヶ月" },
  "rate.3m": { ko: "3개월", en: "3M", ja: "3ヶ月" },
  "rate.dailyLoading": { ko: "일별 환율 조회 중...", en: "Loading daily rates...", ja: "日別為替を照会中..." },
  "rate.dailyError": { ko: "일별 데이터를 불러올 수 없습니다", en: "Unable to load daily data", ja: "日別データを読み込めません" },
  "rate.dailyErrorSub": { ko: "아래 월별 차트를 참고해 주세요", en: "See monthly chart below", ja: "下の月別チャートをご覧ください" },
  "rate.high": { ko: "최고", en: "High", ja: "最高" },
  "rate.low": { ko: "최저", en: "Low", ja: "最低" },
  "rate.avg": { ko: "평균", en: "Avg", ja: "平均" },
  "rate.change": { ko: "변동", en: "Change", ja: "変動" },
  "rate.lowPoint": { ko: "저점", en: "Low", ja: "安値" },
  "rate.highPoint": { ko: "고점", en: "High", ja: "高値" },
  "rate.current": { ko: "현재", en: "Current", ja: "現在" },
  "rate.posInRange": { ko: "범위 내", en: "in range", ja: "レンジ内" },
  "rate.position": { ko: "위치", en: "position", ja: "位置" },
  "rate.source": { ko: "출처: ECB 기준환율 · 영업일 기준", en: "Source: ECB rates · Business days", ja: "出典: ECB基準為替 · 営業日基準" },
  "rate.dataCount": { ko: "일 데이터", en: "days of data", ja: "日分データ" },
  "rate.yearlyChange": { ko: "연도별 변동률", en: "Yearly Change", ja: "年別変動率" },
  "rate.yearlyAvgRange": { ko: "연도별 평균·범위", en: "Yearly Avg & Range", ja: "年別平均・レンジ" },
  "rate.monthlyTrend": { ko: "월별 장기 추이", en: "Monthly Long-term Trend", ja: "月別長期推移" },
  "rate.all": { ko: "전체", en: "All", ja: "全体" },
  "rate.5yAvg": { ko: "평균", en: "Avg", ja: "平均" },
  "rate.minMax": { ko: "최저/최고", en: "Min/Max", ja: "最低/最高" },
  "rate.signal": { ko: "시그널", en: "Signal", ja: "シグナル" },

  // ── 시그널 ──
  "signal.strongBuy": { ko: "적극 매수", en: "Strong Buy", ja: "積極買い" },
  "signal.buy": { ko: "매수 적기", en: "Good to Buy", ja: "買い時" },
  "signal.hold": { ko: "관망", en: "Hold", ja: "様子見" },
  "signal.wait": { ko: "대기 권장", en: "Wait", ja: "待機推奨" },
  "signal.strongRecv": { ko: "적극 수취", en: "Strong Receive", ja: "積極受取" },
  "signal.recv": { ko: "수취 적기", en: "Good to Receive", ja: "受取時" },

  // ── 적정시기 탭 ──
  "timing.outbound": { ko: "🇰🇷→ 해외송금", en: "🇰🇷→ Send Abroad", ja: "🇰🇷→ 海外送金" },
  "timing.inbound": { ko: "→🇰🇷 수취", en: "→🇰🇷 Receive", ja: "→🇰🇷 受取" },
  "timing.sendBest": { ko: "해외송금 BEST (환율 낮을 때)", en: "Best for Sending (Low rates)", ja: "送金ベスト（為替安い時）" },
  "timing.recvBest": { ko: "수취 BEST (환율 높을 때)", en: "Best for Receiving (High rates)", ja: "受取ベスト（為替高い時）" },
  "timing.monthAvg": { ko: "월별 평균", en: "Monthly Avg", ja: "月別平均" },
  "timing.rank": { ko: "위", en: "", ja: "位" },

  // ── 다중 통화 탭 ──
  "multi.currencySelect": { ko: "통화 선택", en: "Select Currencies", ja: "通貨選択" },
  "multi.normalizedIndex": { ko: "정규화 지수 (2020-01=100)", en: "Normalized Index (2020-01=100)", ja: "正規化指数 (2020-01=100)" },
  "multi.currency": { ko: "통화", en: "Currency", ja: "通貨" },
  "multi.current": { ko: "현재", en: "Current", ja: "現在" },
  "multi.5yAvg": { ko: "5년 평균", en: "5Y Avg", ja: "5年平均" },
  "multi.min": { ko: "최저", en: "Min", ja: "最低" },
  "multi.max": { ko: "최고", en: "Max", ja: "最高" },
  "multi.deviation": { ko: "편차", en: "Dev", ja: "偏差" },
  "multi.signal": { ko: "시그널", en: "Signal", ja: "シグナル" },

  // ── 에디토리얼 콘텐츠 ──
  "editorial.compareTitle": { ko: "해외송금 수수료, 왜 서비스마다 다를까?", en: "Why do remittance fees differ by service?", ja: "海外送金手数料、なぜサービスごとに違う？" },
  "editorial.compareBody1": {
    ko: "해외송금 비용은 크게 고정 수수료와 환율 스프레드(마진) 두 가지로 구성됩니다. 핀테크 서비스(Wise, 토스, 센트비 등)는 고정 수수료가 낮지만 환율 마진이 있고, 은행(하나, 신한)은 고정 수수료가 높지만 고액 송금 시 환율 우대를 받을 수 있습니다.",
    en: "Remittance costs consist of fixed fees and exchange rate spreads. Fintech services (Wise, Toss, SentBe) have low fixed fees but rate margins, while banks (Hana, Shinhan) charge higher fees but may offer better rates for large transfers.",
    ja: "海外送金コストは固定手数料と為替スプレッドで構成されます。フィンテック（Wise、トス、センドビー）は固定手数料が低いですがレートマージンがあり、銀行は手数料は高いですが大口送金で為替優遇があります。",
  },
  "editorial.compareBody2": {
    ko: "송금 금액에 따라 최적의 서비스가 달라집니다. 100만원 이하 소액은 수수료 무료 서비스가 유리하고, 500만원 이상 유학비 등 고액 송금은 스프레드가 낮은 서비스가 총 비용에서 유리합니다. 위 비교 결과의 \"실수령\" 금액이 수수료+스프레드를 모두 반영한 실제 수령액입니다.",
    en: "The best service depends on your transfer amount. For small amounts under ₩1M, fee-free services work best. For large transfers like tuition over ₩5M, low-spread services save more overall. The \"You receive\" amount above reflects all fees and spreads.",
    ja: "最適なサービスは送金額により異なります。100万ウォン以下の少額は手数料無料サービスが有利、500万ウォン以上の高額送金はスプレッドの低いサービスが総コストで有利です。上記の「受取額」は手数料+スプレッドを全て反映した実際の受取額です。",
  },
  "editorial.rateTitle": { ko: "환율 분석 활용 가이드", en: "How to Use Rate Analysis", ja: "為替分析活用ガイド" },
  "editorial.rateBody1": {
    ko: "환율은 경제 상황, 금리 차이, 국제 무역 수지 등 다양한 요인에 의해 변동합니다. 위 차트의 노란 점선은 장기 평균을 나타내며, 현재 환율이 평균보다 낮으면 해외송금(원화→외화)에 유리하고, 평균보다 높으면 해외에서 돈을 받는(외화→원화) 데 유리합니다.",
    en: "Exchange rates fluctuate based on economic conditions, interest rate differentials, and trade balance. The yellow dashed line shows the long-term average. Rates below average favor sending money abroad, while rates above average favor receiving money from abroad.",
    ja: "為替レートは経済状況、金利差、貿易収支などにより変動します。黄色の点線は長期平均を示し、平均より低ければ海外送金に有利、高ければ海外からの受取に有利です。",
  },
  "editorial.multiTitle": { ko: "다중 통화 분석이란?", en: "What is Multi-Currency Analysis?", ja: "多通貨分析とは？" },
  "editorial.multiBody1": {
    ko: "위 정규화 지수(2020년 1월 = 100)는 각 통화가 원화 대비 얼마나 강세/약세로 움직였는지를 한눈에 보여줍니다. 지수가 100 이상이면 2020년 초 대비 원화가 약세(해외송금 비용 증가), 100 미만이면 원화가 강세(해외송금 비용 감소)입니다.",
    en: "The normalized index (Jan 2020 = 100) shows how each currency has moved relative to KRW. Above 100 means KRW weakened (remittance costs up), below 100 means KRW strengthened (costs down).",
    ja: "正規化指数（2020年1月=100）は各通貨がウォンに対してどの程度強弱で動いたかを一目で示します。100以上はウォン安（送金コスト増）、100未満はウォン高（コスト減）です。",
  },

  // ── 푸터 ──
  "footer.apiNote": { ko: "환율 API + Wise 비교 API · 자동 갱신 · 운영비 $0", en: "Exchange Rate API + Wise API · Auto-updated · $0 operating cost", ja: "為替API + Wise API · 自動更新 · 運営費$0" },
  "footer.contact": { ko: "문의", en: "Contact", ja: "お問い合わせ" },
  "footer.about": { ko: "서비스 소개", en: "About", ja: "サービス紹介" },
  "footer.blog": { ko: "블로그", en: "Blog", ja: "ブログ" },
  "footer.privacy": { ko: "개인정보 보호정책", en: "Privacy Policy", ja: "プライバシーポリシー" },

  // ── 블로그 ──
  "blog.insights": { ko: "해외송금 인사이트", en: "Remittance Insights", ja: "海外送金インサイト" },
  "blog.viewAll": { ko: "모든 글 보기 →", en: "View All →", ja: "すべて見る →" },

  // ── 공통 ──
  "common.close": { ko: "닫기", en: "Close", ja: "閉じる" },
  "common.back": { ko: "돌아가기", en: "Back", ja: "戻る" },
  "common.won": { ko: "원", en: "KRW", ja: "ウォン" },
  "common.month": { ko: "월", en: "", ja: "月" },

  // ── PWA ──
  "pwa.alreadyInstalled": { ko: "이미 앱으로 설치되어 있습니다!", en: "Already installed as app!", ja: "すでにアプリとしてインストール済みです！" },
  "pwa.ios": { ko: "iOS: 공유(□↑) → \"홈 화면에 추가\"", en: "iOS: Share (□↑) → \"Add to Home Screen\"", ja: "iOS: 共有(□↑) → 「ホーム画面に追加」" },
  "pwa.android": { ko: "Android: 메뉴(⋮) → \"홈 화면에 추가\"", en: "Android: Menu (⋮) → \"Add to Home Screen\"", ja: "Android: メニュー(⋮) → 「ホーム画面に追加」" },
};

export function useI18n() {
  const [lang, setLangState] = useState(detectLang);

  const setLang = useCallback((l) => {
    if (SUPPORTED.includes(l)) {
      setLangState(l);
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l === "ko" ? "ko" : l === "ja" ? "ja" : "en";
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "ko" ? "ko" : lang === "ja" ? "ja" : "en";
  }, [lang]);

  const t = useCallback((key, fallback) => {
    const entry = dict[key];
    if (!entry) return fallback || key;
    return entry[lang] || entry.ko || fallback || key;
  }, [lang]);

  return { lang, setLang, t, SUPPORTED, LANG_META };
}
