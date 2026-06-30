import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, ReferenceLine, Legend, ComposedChart } from "recharts";

// ═══════════════════════════════════════════════════
// EXTRACTED MODULES
// ═══════════════════════════════════════════════════
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CTooltip } from "./components/CTooltip";
import { AmountInput } from "./components/AmountInput";
import { AdSenseAd } from "./components/AdSenseAd";
import { BlogListPage } from "./components/BlogListPage";
import { BlogPostPage } from "./components/BlogPostPage";
import { AboutPage } from "./components/AboutPage";
import { PrivacyPage } from "./components/PrivacyPage";

import { trackEvent } from "./utils/analytics";
import { CURRENCIES, SVC_AVAIL } from "./utils/constants";
import { HIST } from "./utils/histData";
import { isBusinessDay, getNonBusinessReason } from "./utils/dateUtils";
import { fonts, typeScale, fontWeight as fw, lineHeight as lh, tracking, spacing, radius, RATE_CACHE_TTL } from "./styles/theme";
import { fetchAllAndCompute, fetchMidRates, fetchWorkerRates, loadFeePolicies, fetchDailyHistory } from "./utils/rateFetcher";
import { useI18n } from "./utils/i18n";
import { useTheme } from "./utils/useTheme";

export { ErrorBoundary };

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function App() {
  const { lang, setLang, t, SUPPORTED, LANG_META } = useI18n();
  const { mode, toggle, c } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState("compare");
  // Path-based routing for SEO
  const getRouteFromPath = () => {
    const path = window.location.pathname;
    if (path === "/" || path === "") return { page: "main", slug: null };
    if (path === "/about") return { page: "about", slug: null };
    if (path === "/privacy") return { page: "privacy", slug: null };
    if (path === "/blog") return { page: "blog", slug: null };
    if (path.startsWith("/blog/")) return { page: "blogPost", slug: path.slice(6) };
    return { page: "main", slug: null };
  };
  const [route, setRoute] = useState(getRouteFromPath);
  const page = route.page;
  const navigate = useCallback((path) => {
    window.history.pushState(null, "", path);
    setRoute({
      page: path === "/" ? "main" : path === "/about" ? "about" : path === "/privacy" ? "privacy" : path === "/blog" ? "blog" : path.startsWith("/blog/") ? "blogPost" : "main",
      slug: path.startsWith("/blog/") ? path.slice(6) : null,
    });
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const onPop = () => setRoute(getRouteFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [cur, setCur] = useState("USD");
  const [amount, setAmount] = useState(1000000);
  const [direction, setDirection] = useState("outbound");
  const [selectedYear, setSelectedYear] = useState("all");
  const [multiCur, setMultiCur] = useState(["USD","JPY","EUR"]);

  // Live state
  const [midRate, setMidRate] = useState(null);
  const [svcSnapshot, setSvcSnapshot] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [bizDayBlocked, setBizDayBlocked] = useState(false);

  // Fee data from fee-data.json
  const [feeData, setFeeData] = useState(null);
  const [feeDataMeta, setFeeDataMeta] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Posts from Notion CMS
  const [posts, setPosts] = useState([]);

  const ci = CURRENCIES[cur];
  const hist = HIST[cur] || [];
  const curRate = midRate || ci.base;
  const avg = hist.length ? Math.round(hist.reduce((a,b)=>a+b.r,0)/hist.length) : 0;
  const mn = hist.length ? Math.min(...hist.map(d=>d.r)) : 0;
  const mx = hist.length ? Math.max(...hist.map(d=>d.r)) : 0;
  const recentHist = hist.slice(-12);
  const recent1YAvg = recentHist.length ? Math.round(recentHist.reduce((a,b)=>a+b.r,0)/recentHist.length) : 0;
  const recent1YMin = recentHist.length ? Math.min(...recentHist.map(d=>d.r)) : 0;
  const recent1YMax = recentHist.length ? Math.max(...recentHist.map(d=>d.r)) : 0;

  // ═══════════════════════════════════════════════════
  // LOAD FEE DATA
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    const loadFeeData = async () => {
      setDataLoading(true);
      try {
        const resp = await fetch("/fee-data.json?" + Date.now());
        if (resp.ok) {
          const data = await resp.json();
          setFeeData(data);
          setFeeDataMeta({
            updatedAt: data.updatedAt,
            source: data.source,
            schedule: data.schedule,
            stats: data.stats,
          });
        } else {
          throw new Error("HTTP " + resp.status);
        }
      } catch (err) {
        console.warn("fee-data.json load failed:", err.message);
        setFeeData(null);
        setFeeDataMeta({ updatedAt: "error", source: "none" });
      }
      setDataLoading(false);
    };
    loadFeeData();
  }, []);

  // ═══════════════════════════════════════════════════
  // LOAD POSTS
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    fetch("/posts.json?" + Date.now())
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.posts) setPosts(data.posts); })
      .catch(() => {});
  }, []);

  // ═══════════════════════════════════════════════════
  // REAL-TIME EXCHANGE RATE
  // ═══════════════════════════════════════════════════
  const [liveRates, setLiveRates] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateFetchedAt, setRateFetchedAt] = useState(null);
  const rateCacheRef = useRef(null);

  const fetchLiveRates = useCallback(async () => {
    if (rateCacheRef.current && (Date.now() - rateCacheRef.current.time < RATE_CACHE_TTL)) {
      setLiveRates(rateCacheRef.current.rates);
      setRateFetchedAt(new Date(rateCacheRef.current.time));
      return rateCacheRef.current.rates;
    }

    setRateLoading(true);
    try {
      const resp = await fetch("https://open.er-api.com/v6/latest/KRW");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (data.result !== "success") throw new Error(data["error-type"] || "Unknown error");

      const rates = {};
      for (const [code, info] of Object.entries(CURRENCIES)) {
        const rawRate = data.rates[code];
        if (!rawRate) continue;
        const unit = info.unit || 1;
        rates[code] = Math.round((1 / rawRate) * unit);
      }

      rateCacheRef.current = { rates, time: Date.now() };
      setLiveRates(rates);
      setRateFetchedAt(new Date());
      setRateLoading(false);
      return rates;
    } catch (err) {
      console.warn("Live rate fetch failed:", err.message);
      setRateLoading(false);
      if (feeData?.rates?.[cur]) {
        return { [cur]: feeData.rates[cur].midRate };
      }
      return null;
    }
  }, [cur, feeData]);

  // ═══════════════════════════════════════════════════
  // COMPARE: 실시간 환율 + 고정 수수료/스프레드
  // ═══════════════════════════════════════════════════
  const [fetchMode, setFetchMode] = useState("idle");

  const refreshData = useCallback(async () => {
    setFetchMode("loading");
    setBizDayBlocked(!isBusinessDay());

    try {
      const result = await fetchAllAndCompute(cur, amount);

      if (!result.midRate) {
        // 폴백: fee-data.json 사용
        const curData = feeData?.rates?.[cur];
        if (curData?.midRate) {
          setMidRate(curData.midRate);
          const services = (curData.services || []).filter(s => s.supported).map(svc => ({
            ...svc,
            avail: SVC_AVAIL[svc.id] || { weekend: false, holiday: false, label: "확인필요", processNote: "" },
            source: "fallback",
          }));
          services.sort((a, b) => (a.totalCost || Infinity) - (b.totalCost || Infinity));
          setSvcSnapshot(services);
          setLastUpdate(new Date());
          setFetchMode("cached");
        } else {
          setFetchMode("error");
        }
        return;
      }

      setMidRate(result.midRate);

      const services = result.services.map(svc => ({
        ...svc,
        avail: SVC_AVAIL[svc.id] || { weekend: false, holiday: false, label: "확인필요", processNote: "" },
      }));

      setSvcSnapshot(services);
      setLastUpdate(new Date());
      setFetchMode(result.sources.midRate === "live" ? "live" : "cached");
    } catch (err) {
      console.warn("refreshData failed:", err.message);
      setFetchMode("error");
    }
  }, [cur, amount, feeData]);

  const handleRefresh = () => {
    if (amount <= 0) return;
    trackEvent('compare_rates', {
      currency: cur,
      amount: amount,
      amount_category: amount < 1000000 ? 'under_1M' : amount < 5000000 ? '1M_5M' : amount < 10000000 ? '5M_10M' : 'over_10M'
    });
    refreshData();
  };

  useEffect(() => {
    setFetchMode("idle");
    setSvcSnapshot([]);
    setMidRate(null);
    setLastUpdate(null);
  }, [cur, amount]);

  const getSignal = (r, a) => {
    if(direction==="outbound") {
      if(r<=a*0.95) return {s:"적극 매수",c:"#00B442",i:"🟢"};
      if(r<=a) return {s:"매수 적기",c:"#296CF2",i:"🔵"};
      if(r<=a*1.05) return {s:"관망",c:"#FFA012",i:"🟡"};
      return {s:"대기 권장",c:"#F34646",i:"🔴"};
    }
    if(r>=a*1.05) return {s:"적극 수취",c:"#00B442",i:"🟢"};
    if(r>=a) return {s:"수취 적기",c:"#296CF2",i:"🔵"};
    return {s:"대기 권장",c:"#F34646",i:"🔴"};
  };
  const sig = getSignal(curRate, recent1YAvg);

  const seasonalData = useMemo(() => {
    const months = Array.from({length:12},(_,i)=>({m:i+1,label:`${i+1}월`,rates:[]}));
    hist.forEach(d=>{months[parseInt(d.d.split("-")[1])-1].rates.push(d.r);});
    return months.map(m=>({...m,avg:m.rates.length?Math.round(m.rates.reduce((a,b)=>a+b,0)/m.rates.length):0,min:m.rates.length?Math.min(...m.rates):0,max:m.rates.length?Math.max(...m.rates):0}));
  }, [hist]);

  const recentSeasonalData = useMemo(() => {
    const months = Array.from({length:12},(_,i)=>({m:i+1,label:`${i+1}월`,rate:null,change:null}));
    recentHist.forEach(d=>{
      const mi = parseInt(d.d.split("-")[1])-1;
      months[mi].rate = d.r;
    });
    // 전월 대비 변화율 계산
    for(let i=0;i<recentHist.length;i++){
      if(i>0){
        const mi = parseInt(recentHist[i].d.split("-")[1])-1;
        const prev = recentHist[i-1].r;
        months[mi].change = Math.round((recentHist[i].r - prev)/prev*10000)/100;
      }
    }
    return months;
  }, [recentHist]);

  const recentTrend = useMemo(() => {
    if(recentHist.length<2) return {direction:"flat",pct:0};
    const first = recentHist[0].r, last = recentHist[recentHist.length-1].r;
    const pct = Math.round((last-first)/first*10000)/100;
    return {direction:pct>0?"up":pct<0?"down":"flat",pct};
  }, [recentHist]);

  const percentilePos = useMemo(() => {
    if(!recentHist.length) return 50;
    const sorted = [...recentHist].map(d=>d.r).sort((a,b)=>a-b);
    const below = sorted.filter(r=>r<curRate).length;
    return Math.round(below/sorted.length*100);
  }, [recentHist, curRate]);

  const filteredHist = selectedYear==="all" ? hist : hist.filter(d=>d.d.startsWith(selectedYear));

  const tabs = [
    {id:"compare",label:t("tab.compare"),icon:"⚖️"},
    {id:"rate",label:t("tab.rate"),icon:"📈"},
    {id:"timing",label:t("tab.timing"),icon:"⏰"},
    {id:"multi",label:t("tab.multi"),icon:"🌍"},
  ];

  // ═══════════════════════════════════════════════════
  // CURRENCY SELECT MODAL
  // ═══════════════════════════════════════════════════
  const [curOpen, setCurOpen] = useState(false);

  const curOptions = Object.entries(CURRENCIES);

  useEffect(() => {
    if (curOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [curOpen]);

  const CurPicker = () => (
    <>
      <div
        onClick={() => setCurOpen(true)}
        role="button"
        aria-label="수취 통화 선택"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCurOpen(true); }}
        style={{
          display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,cursor:"pointer",
          border: "1px solid #E5E7EB",
          background: "#F7F8FA",
          transition:"all 0.2s", minHeight:48,
        }}
      >
        <span style={{fontSize:"clamp(20px, 5.5vw, 22px)",flexShrink:0}}>{ci.flag}</span>
        <div style={{flex:1,minWidth:0}}>
          <span style={{color:"#222222",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700}}>{cur}</span>
          <span style={{color:"#757575",fontSize:"clamp(14px, 3.5vw, 14px)",marginLeft:8}}>{ci.name}</span>
        </div>
        <span style={{color:"#949494",fontSize:"clamp(14px, 3.5vw, 14px)",flexShrink:0}}>▼</span>
      </div>

      {curOpen && (
        <div
          onClick={() => setCurOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="통화 선택"
          style={{
            position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,
            background:"rgba(0,0,0,0.45)",
            display:"flex",alignItems:"flex-end",
            animation:"fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:"100%",
              maxHeight:"70vh",
              background:"#FFFFFF",
              borderRadius:"20px 20px 0 0",
              overflow:"hidden",
              animation:"slideUp 0.3s ease-out",
            }}
          >
            <div style={{
              padding:"20px",
              borderBottom:"1px solid #E5E7EB",
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center",
            }}>
              <h3 style={{color:"#222222",fontSize:"clamp(16px, 4.2vw, 18px)",fontWeight:700,margin:0}}>
                수취 통화 선택
              </h3>
              <button
                onClick={() => setCurOpen(false)}
                aria-label="닫기"
                style={{
                  background:"transparent",
                  border:"none",
                  color:"#757575",
                  fontSize:"clamp(24px, 6vw, 28px)",
                  cursor:"pointer",
                  padding:"0 8px",
                  lineHeight:1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{overflowY:"auto",maxHeight:"calc(70vh - 80px)",WebkitOverflowScrolling:"touch"}}>
              {curOptions.map(([code, info]) => (
                <div
                  key={code}
                  role="option"
                  aria-selected={cur === code}
                  tabIndex={0}
                  onClick={() => {
                    trackEvent('currency_change', {
                      from_currency: cur,
                      to_currency: code,
                      method: 'modal'
                    });
                    setCur(code);
                    setCurOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setCur(code);
                      setCurOpen(false);
                    }
                  }}
                  style={{
                    display:"flex",alignItems:"center",gap:12,padding:"16px 20px",cursor:"pointer",
                    background: cur === code ? "rgba(41,108,242,0.08)" : "transparent",
                    borderLeft: cur === code ? "4px solid #296CF2" : "4px solid transparent",
                    transition:"background 0.15s",
                  }}
                  onMouseEnter={e => { if(cur!==code) e.currentTarget.style.background = "#F7F8FA"; }}
                  onMouseLeave={e => { if(cur!==code) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{fontSize:"clamp(24px, 6vw, 28px)",flexShrink:0}}>{info.flag}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color: cur===code ? "#296CF2" : "#222222", fontSize:"clamp(15px, 4vw, 16px)", fontWeight:700}}>{code}</div>
                    <div style={{color:"#4C4C4C",fontSize:"clamp(13px, 3.5vw, 14px)",marginTop:2}}>{info.name}</div>
                  </div>
                  {cur === code && <span style={{color:"#296CF2",fontSize:"clamp(20px, 5vw, 24px)",flexShrink:0}}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );

  // ═══════════════════════════════════════════════════
  // TAB: FAIR COMPARE
  // ═══════════════════════════════════════════════════
  const compareContent = (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {bizDayBlocked && svcSnapshot.length > 0 && (
        <div role="alert" style={{padding:"12px 16px",borderRadius:12,background:"rgba(255,160,18,0.05)",border:"1px solid rgba(255,160,18,0.12)"}}>
          <p style={{color:"#FFA012",fontSize:"clamp(14px, 3.5vw, 15px)",fontWeight:700,margin:"0 0 4px"}}>
            📅 현재 {getNonBusinessReason()}
          </p>
          <p style={{color:"#4C4C4C",fontSize:"clamp(14px, 3.5vw, 14px)",margin:0,lineHeight:1.5}}>
            🟢 핀테크: 신청 가능 (처리는 영업일) · 🔴 은행: 영업일만
          </p>
        </div>
      )}

      <div style={{background:"#F7F8FA",borderRadius:14,padding:"14px 16px",border:"1px solid #F0F1F3"}}>
        <div style={{marginBottom:14}}>
          <span style={{color:"#4C4C4C",fontSize:"clamp(14px, 3.5vw, 15px)",fontWeight:600,display:"block",marginBottom:8}}>🌍 수취 통화</span>
          <CurPicker />
        </div>

        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4}}>
            <span style={{color:"#4C4C4C",fontSize:"clamp(14px, 3.5vw, 15px)",fontWeight:600}}>💰 송금 금액</span>
            {amount > 0 && (
              <span style={{color:"#757575",fontSize:"clamp(14px, 3.5vw, 14px)"}}>
                {amount >= 100000000 ? `${Math.floor(amount/100000000)}억 ` : ""}
                {amount % 100000000 >= 10000 ? `${Math.floor((amount%100000000)/10000).toLocaleString()}만` : ""}
                {amount % 10000 > 0 ? ` ${(amount%10000).toLocaleString()}` : ""}원
              </span>
            )}
          </div>
          <AmountInput amount={amount} setAmount={setAmount} />
        </div>

        <style>{`
          @keyframes web3Shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes borderGlow {
            0%, 100% { border-color: rgba(41,108,242,0.3); box-shadow: 0 0 12px rgba(41,108,242,0.1); }
            50% { border-color: rgba(41,108,242,0.5); box-shadow: 0 0 16px rgba(41,108,242,0.15); }
          }
          .web3-btn:active:not(:disabled) { transform: scale(0.98); }
        `}</style>
        <button className="web3-btn" onClick={handleRefresh} disabled={dataLoading || fetchMode==="loading"} aria-label="실시간 수수료 비교 시작" style={{
          width:"100%", padding:"16px", borderRadius:14,
          border: (dataLoading || fetchMode==="loading") ? "1px solid #E5E7EB" : "1px solid rgba(41,108,242,0.3)",
          cursor:(dataLoading || fetchMode==="loading")?"not-allowed":"pointer",
          background: (dataLoading || fetchMode==="loading")
            ? "#F7F8FA"
            : "linear-gradient(135deg, rgba(41,108,242,0.08), rgba(41,108,242,0.12), rgba(41,108,242,0.08))",
          backgroundSize: "400% 400%",
          animation: (dataLoading || fetchMode==="loading") ? "none" : "web3Shimmer 6s ease infinite, borderGlow 4s ease infinite",
          color: (dataLoading || fetchMode==="loading") ? "#949494" : "#222222",
          fontSize:15, fontWeight:700,
          opacity: (dataLoading || fetchMode==="loading") ? 0.5 : 1,
          minHeight:54, position:"relative", overflow:"hidden",
        }}>
          {!(dataLoading || fetchMode==="loading") && <span style={{
            position:"absolute", top:0, left:"-100%", width:"200%", height:"100%",
            background:"linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent)",
            animation:"web3Shimmer 3s ease infinite", pointerEvents:"none",
          }} />}
          <span style={{position:"relative",zIndex:1}}>
            {dataLoading ? "⏳ 로딩 중..." :
             fetchMode==="loading" ? "🔄 환율 조회 중..." :
             amount > 0 ? `⚖️ ₩${amount.toLocaleString()} → ${cur} 실시간 비교` : "금액을 입력하세요"}
          </span>
        </button>
      </div>

      {(fetchMode !== "idle" || svcSnapshot.length > 0) && (
        <div role="status" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:"#F7F8FA",border:"1px solid #F0F1F3",flexWrap:"wrap"}}>
          <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.5)}}`}</style>
          {fetchMode==="loading" && <div style={{width:8,height:8,borderRadius:"50%",background:"#296CF2",animation:"pulse 2s infinite",flexShrink:0}} />}
          {fetchMode==="live" && <div style={{width:8,height:8,borderRadius:"50%",background:"#00B442",flexShrink:0}} />}
          {fetchMode==="cached" && <div style={{width:8,height:8,borderRadius:"50%",background:"#FFA012",flexShrink:0}} />}
          {fetchMode==="error" && <div style={{width:8,height:8,borderRadius:"50%",background:"#F34646",flexShrink:0}} />}
          <span style={{color:"#4C4C4C",fontSize:"clamp(14px, 3.5vw, 14px)",lineHeight:1.4}}>
            {fetchMode==="loading" ? "조회 중..." :
             fetchMode==="live" ? "실시간 환율" :
             fetchMode==="cached" ? "저장 환율" :
             fetchMode==="error" ? "데이터 없음" : "대기"}
            {midRate && <> · <strong style={{color:"#222222"}}>₩{midRate.toLocaleString()}</strong>/{cur}</>}
            {lastUpdate && <> · {lastUpdate.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</>}
          </span>
        </div>
      )}

      {svcSnapshot.length > 0 ? (
        <>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {svcSnapshot.map((s,i)=>{
              const unavailable = bizDayBlocked && !s.avail.weekend;
              const isTop = i === 0;
              return (
                <div key={s.id} style={{
                  padding:"14px 16px", borderRadius:14,
                  background: isTop ? "rgba(0,180,66,0.04)" : "#F7F8FA",
                  border: isTop ? "1px solid rgba(0,180,66,0.15)" : "1px solid #F0F1F3",
                  opacity: unavailable ? 0.45 : 1,
                }}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:8}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:8,flex:1,minWidth:0}}>
                      <span style={{fontSize:"clamp(16px, 4.5vw, 18px)",flexShrink:0}}>{isTop?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</span>
                      <div style={{minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
                          <span style={{color:"#222222",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700}}>{s.name}</span>
                          {bizDayBlocked && (
                            <span style={{
                              padding:"3px 7px", borderRadius:4, fontSize:"clamp(12px, 3vw, 12px)", fontWeight:600,
                              background: s.avail.weekend ? "rgba(0,180,66,0.1)" : "rgba(243,70,70,0.1)",
                              color: s.avail.weekend ? "#00B442" : "#F34646",
                              whiteSpace:"nowrap",
                            }}>
                              {s.avail.weekend ? "신청가능" : "영업일만"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <p style={{color:isTop?"#00B442":"#222222",fontSize:"clamp(15px, 4.2vw, 17px)",fontWeight:800,margin:0,fontFamily:"Roboto, 'Noto Sans', sans-serif",whiteSpace:"nowrap"}}>
                        {ci.symbol}{s.foreignAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </p>
                      <p style={{color:"#949494",fontSize:"clamp(12px, 3vw, 12px)",margin:0}}>실수령</p>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{color:"#4C4C4C",fontSize:"clamp(14px, 3.5vw, 14px)",background:"#F7F8FA",padding:"4px 8px",borderRadius:6,whiteSpace:"nowrap"}}>
                      수수료 {s.fee===0?<span style={{color:"#00B442"}}>무료</span>:`₩${s.fee.toLocaleString()}`}
                    </span>
                    <span style={{color:s.spread>2?"#F34646":s.spread>1?"#FFA012":"#00B442",fontSize:"clamp(14px, 3.5vw, 14px)",background:"#F7F8FA",padding:"4px 8px",borderRadius:6,whiteSpace:"nowrap"}}>
                      스프레드 {s.spread}%
                    </span>
                    <span style={{color:"#757575",fontSize:"clamp(14px, 3.5vw, 14px)",background:"#F7F8FA",padding:"4px 8px",borderRadius:6,whiteSpace:"nowrap"}}>
                      {s.speed}
                    </span>
                  </div>
                  {s.promotions && (
                    <p style={{color:"#FFA012",fontSize:"clamp(12px, 3vw, 12px)",margin:"6px 0 0",lineHeight:1.4}}>🏷️ {s.promotions}</p>
                  )}
                </div>
              );
            })}
          </div>

          {svcSnapshot.length >= 2 && (
            <div style={{padding:"14px 16px",borderRadius:14,background:"rgba(0,180,66,0.04)",border:"1px solid rgba(0,180,66,0.1)"}}>
              <p style={{color:"#00B442",fontSize:"clamp(14px, 3.5vw, 15px)",fontWeight:700,margin:0,lineHeight:1.5}}>
                💡 {svcSnapshot[0].name} 이용 시 최대 ₩{(svcSnapshot[svcSnapshot.length-1].totalCost - svcSnapshot[0].totalCost).toLocaleString()} 절감
              </p>
              <p style={{color:"#4C4C4C",fontSize:"clamp(14px, 3.5vw, 14px)",margin:"4px 0 0",lineHeight:1.4}}>
                vs {svcSnapshot[svcSnapshot.length-1].name} 대비 · {ci.symbol}{(svcSnapshot[0].foreignAmount - svcSnapshot[svcSnapshot.length-1].foreignAmount).toFixed(2)} 더 수령
              </p>
            </div>
          )}

          <div style={{background:"#F7F8FA",borderRadius:14,padding:"12px 10px",border:"1px solid #F0F1F3",overflowX:"auto"}}>
            <p style={{color:"#4C4C4C",fontSize:"clamp(14px, 3.5vw, 14px)",margin:"0 0 8px",fontWeight:600,paddingLeft:4}}>실수령 비교 · ₩{amount.toLocaleString()} → {cur}</p>
            <ResponsiveContainer width="100%" height={Math.max(260, svcSnapshot.length * 40)} minWidth={300}>
              <BarChart data={svcSnapshot} layout="vertical" margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
                <XAxis type="number" tick={{fill:"#757575",fontSize:"clamp(12px, 3vw, 12px)"}} tickFormatter={v=>`${ci.symbol}${v.toFixed(0)}`}/>
                <YAxis dataKey="kr" type="category" tick={{fill:"#4C4C4C",fontSize:"clamp(12px, 3vw, 12px)"}} width={60}/>
                <Tooltip content={<CTooltip/>}/>
                <Bar dataKey="foreignAmount" name={`실수령(${cur})`} radius={[0,4,4,0]}>
                  {svcSnapshot.map((s,i) => (
                    <Cell key={s.id} fill={i===0?"#00B442":i<3?"#296CF2":"#949494"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{background:"#F7F8FA",borderRadius:14,padding:"16px",border:"1px solid #F0F1F3"}}>
            <h3 style={{color:"#222222",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700,margin:"0 0 10px"}}>해외송금 수수료, 왜 서비스마다 다를까?</h3>
            <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3.2vw, 13px)",lineHeight:1.8,margin:"0 0 10px"}}>
              해외송금 비용은 크게 <strong style={{color:"#222222"}}>고정 수수료</strong>와 <strong style={{color:"#222222"}}>환율 스프레드(마진)</strong> 두 가지로 구성됩니다.
              핀테크 서비스(Wise, 토스, 센트비 등)는 고정 수수료가 낮지만 환율 마진이 있고,
              은행(하나, 신한)은 고정 수수료가 높지만 고액 송금 시 환율 우대를 받을 수 있습니다.
            </p>
            <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3.2vw, 13px)",lineHeight:1.8,margin:"0 0 10px"}}>
              송금 금액에 따라 최적의 서비스가 달라집니다. 100만원 이하 소액은 수수료 무료 서비스가 유리하고,
              500만원 이상 유학비 등 고액 송금은 스프레드가 낮은 서비스가 총 비용에서 유리합니다.
              위 비교 결과의 <strong style={{color:"#222222"}}>"실수령"</strong> 금액이 수수료+스프레드를 모두 반영한 실제 수령액입니다.
            </p>
            <p style={{color:"#757575",fontSize:"clamp(11px, 2.8vw, 12px)",lineHeight:1.6,margin:0}}>
              본 비교는 각 서비스 공식 API와 공시 환율을 기반으로 하며, 특정 서비스를 추천하지 않습니다.
              실제 송금 시 금액은 각 서비스에서 직접 확인하세요.
            </p>
          </div>

          <AdSenseAd slot="1234567890" format="auto" responsive={true} style={{ minHeight: 90 }} />
        </>
      ) : (
        <div style={{textAlign:"center",padding:"40px 20px",color:"#949494"}}>
          <p style={{fontSize:"clamp(32px, 10vw, 40px)",margin:"0 0 12px"}}>⚖️</p>
          <p style={{fontSize:"clamp(14px, 3.8vw, 15px)",margin:0,fontWeight:600,lineHeight:1.5}}>
            {dataLoading ? "데이터 로딩 중..." : fetchMode==="error" ? `${cur} 데이터 없음` : "금액 입력 후 비교 버튼을 눌러주세요"}
          </p>
        </div>
      )}
    </div>
  );

  // ── 최근 3개월 일별 데이터 ──
  const [dailyData, setDailyData] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState(null);
  const [dailyPeriod, setDailyPeriod] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setDailyLoading(true);
    setDailyError(null);
    fetchDailyHistory(cur, dailyPeriod)
      .then(data => { if (!cancelled) setDailyData(data); })
      .catch(err => { if (!cancelled) setDailyError(err.message); })
      .finally(() => { if (!cancelled) setDailyLoading(false); });
    return () => { cancelled = true; };
  }, [cur, dailyPeriod]);

  const dailyStats = useMemo(() => {
    if (!dailyData.length) return null;
    const rates = dailyData.map(d => d.r);
    const hi = Math.max(...rates);
    const lo = Math.min(...rates);
    const latest = rates[rates.length - 1];
    const first = rates[0];
    const chg = ((latest - first) / first * 100).toFixed(2);
    const avg3m = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    const pos = hi !== lo ? Math.round((latest - lo) / (hi - lo) * 100) : 50;
    return { hi, lo, latest, first, chg, avg3m, pos };
  }, [dailyData]);

  // ═══════════════════════════════════════════════════
  // TAB: RATE ANALYSIS
  // ═══════════════════════════════════════════════════
  const RateTab = () => {
    const yearly = useMemo(()=>[2020,2021,2022,2023,2024,2025,2026].map(y=>{
      const yd=hist.filter(d=>d.d.startsWith(String(y)));const rs=yd.map(d=>d.r);
      return{year:y,avg:rs.length?Math.round(rs.reduce((a,b)=>a+b,0)/rs.length):0,min:rs.length?Math.min(...rs):0,max:rs.length?Math.max(...rs):0,vol:rs.length?Math.max(...rs)-Math.min(...rs):0,chg:rs.length>1?((rs[rs.length-1]-rs[0])/rs[0]*100).toFixed(1):"0"};
    }),[hist]);

    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:1,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 100%",marginBottom:8}}><CurPicker/></div>
        </div>

        {/* ── 최근 3개월 일별 추이 ── */}
        <div style={{background:"#F7F8FA",borderRadius:14,padding:"14px 12px",border:"1px solid #E5E7EB"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <p style={{color:"#222222",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700,margin:0}}>
              📊 최근 일별 환율 추이
            </p>
            <div style={{display:"flex",gap:4}}>
              {[{v:1,l:"1개월"},{v:2,l:"2개월"},{v:3,l:"3개월"}].map(p=>(
                <button key={p.v} onClick={()=>setDailyPeriod(p.v)} aria-pressed={dailyPeriod===p.v} style={{
                  padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",
                  background:dailyPeriod===p.v?"#E5E7EB":"#F7F8FA",
                  color:dailyPeriod===p.v?"#222222":"#949494",fontSize:"clamp(12px, 3vw, 12px)",fontWeight:600,
                  minHeight:32,
                }}>{p.l}</button>
              ))}
            </div>
          </div>

          {dailyLoading ? (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{width:24,height:24,border:"2px solid #E5E7EB",borderTop:`2px solid ${ci.color}`,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}} />
              <p style={{color:"#949494",fontSize:"clamp(12px, 3vw, 12px)",margin:0}}>일별 환율 조회 중...</p>
            </div>
          ) : dailyError ? (
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <p style={{color:"#757575",fontSize:"clamp(12px, 3vw, 13px)",margin:0,lineHeight:1.5}}>
                일별 데이터를 불러올 수 없습니다<br/>
                <span style={{color:"#949494",fontSize:"clamp(11px, 2.8vw, 12px)"}}>아래 월별 차트를 참고해 주세요</span>
              </p>
            </div>
          ) : dailyData.length > 0 && dailyStats ? (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:6,marginBottom:12}}>
                {[
                  {l:"최고",v:`₩${dailyStats.hi.toLocaleString()}`,c:"#F34646"},
                  {l:"최저",v:`₩${dailyStats.lo.toLocaleString()}`,c:"#296CF2"},
                  {l:"평균",v:`₩${dailyStats.avg3m.toLocaleString()}`,c:"#4C4C4C"},
                  {l:"변동",v:`${parseFloat(dailyStats.chg)>0?"+":""}${dailyStats.chg}%`,c:parseFloat(dailyStats.chg)>0?"#F34646":"#00B442"},
                ].map((s,i)=>(
                  <div key={i} style={{background:"#FFFFFF",borderRadius:8,padding:"8px 6px",textAlign:"center",border:"1px solid #F0F1F3"}}>
                    <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0}}>{s.l}</p>
                    <p style={{color:s.c,fontSize:"clamp(12px, 3.2vw, 14px)",fontWeight:700,margin:"2px 0 0",fontFamily:"Roboto, 'Noto Sans', sans-serif"}}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div style={{marginBottom:12,padding:"0 4px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:"#296CF2",fontSize:"clamp(10px, 2.5vw, 11px)"}}>저점 ₩{dailyStats.lo.toLocaleString()}</span>
                  <span style={{color:"#F34646",fontSize:"clamp(10px, 2.5vw, 11px)"}}>고점 ₩{dailyStats.hi.toLocaleString()}</span>
                </div>
                <div style={{position:"relative",height:6,background:"#E5E7EB",borderRadius:3}}>
                  <div style={{
                    position:"absolute",top:0,left:0,height:"100%",borderRadius:3,
                    width:`${dailyStats.pos}%`,
                    background:`linear-gradient(90deg, #296CF2, ${ci.color})`,
                  }} />
                  <div style={{
                    position:"absolute",top:-3,
                    left:`calc(${dailyStats.pos}% - 6px)`,
                    width:12,height:12,borderRadius:"50%",
                    background:ci.color,border:"2px solid #FFFFFF",
                  }} />
                </div>
                <p style={{color:"#4C4C4C",fontSize:"clamp(10px, 2.5vw, 11px)",margin:"6px 0 0",textAlign:"center"}}>
                  현재 ₩{dailyStats.latest.toLocaleString()} · 범위 내 {dailyStats.pos}% 위치
                </p>
              </div>

              <div style={{overflowX:"auto"}}>
                <ResponsiveContainer width="100%" height={260} minWidth={300}>
                  <AreaChart data={dailyData} margin={{left:0,right:10,top:5,bottom:5}}>
                    <defs>
                      <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ci.color} stopOpacity={0.2}/>
                        <stop offset="100%" stopColor={ci.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
                    <XAxis
                      dataKey="d"
                      tick={{fill:"#757575",fontSize:"clamp(10px, 2.2vw, 11px)"}}
                      tickFormatter={v => {const p=v.split("-"); return `${parseInt(p[1])}/${parseInt(p[2])}`;}}
                      interval={dailyPeriod===1?4:dailyPeriod===2?9:14}
                    />
                    <YAxis
                      tick={{fill:"#757575",fontSize:"clamp(10px, 2.2vw, 11px)"}}
                      domain={["dataMin-5","dataMax+5"]}
                      tickFormatter={v=>`₩${v.toLocaleString()}`}
                    />
                    <Tooltip content={<CTooltip/>}/>
                    <ReferenceLine y={dailyStats.avg3m} stroke="#FFA012" strokeDasharray="4 4" label={{value:"평균",fill:"#FFA012",fontSize:10,position:"right"}}/>
                    <Area type="monotone" dataKey="r" stroke={ci.color} fill="url(#dailyGrad)" strokeWidth={2} name={`${ci.flag} ${cur}/KRW`} dot={false} activeDot={{r:4,fill:ci.color,stroke:"#FFFFFF",strokeWidth:2}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 11px)",margin:"8px 0 0",textAlign:"right"}}>
                출처: ECB 기준환율 · 영업일 기준 · {dailyData.length}일 데이터
              </p>
            </>
          ) : null}
        </div>

        {/* ── 장기 분석 ── */}
        <div style={{display:"flex",gap:1,alignItems:"center",flexWrap:"wrap"}}>
          {["all","2020","2021","2022","2023","2024","2025","2026"].map(y=>(
            <button key={y} onClick={()=>setSelectedYear(y)} aria-pressed={selectedYear===y} style={{
              padding:"8px 10px",borderRadius:10,border:"none",cursor:"pointer",
              background:selectedYear===y?"#E5E7EB":"#F7F8FA",
              color:selectedYear===y?"#222222":"#949494",fontSize:"clamp(14px, 3.5vw, 14px)",fontWeight:600,
              minHeight:36,flex:"1 0 auto",
            }}>{y==="all"?"전체":y}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:8}}>
          {[{l:"현재",v:`₩${curRate.toLocaleString()}`,a:ci.color},{l:"평균",v:`₩${avg.toLocaleString()}`,a:"#296CF2"},{l:"최저/최고",v:`${mn}~${mx}`,a:"#FFA012"},{l:"시그널",v:sig.s,a:sig.c}].map((k,i)=>(
            <div key={i} style={{background:"#F7F8FA",borderRadius:10,padding:"12px",border:"1px solid #F0F1F3",borderTop:`2px solid ${k.a}`}}>
              <p style={{color:"#949494",fontSize:"clamp(12px, 3vw, 12px)",margin:0}}>{k.l}</p>
              <p style={{color:"#222222",fontSize:"clamp(15px, 4.5vw, 18px)",fontWeight:700,margin:"4px 0 0",fontFamily:"Roboto, 'Noto Sans', sans-serif",wordBreak:"break-word"}}>{k.v}</p>
            </div>
          ))}
        </div>
        <div style={{background:"#F7F8FA",borderRadius:12,padding:"12px 8px",border:"1px solid #F0F1F3",overflowX:"auto"}}>
          <p style={{color:"#757575",fontSize:"clamp(12px, 3vw, 12px)",margin:"0 0 8px",fontWeight:600,paddingLeft:6}}>월별 장기 추이</p>
          <ResponsiveContainer width="100%" height={280} minWidth={300}>
            <AreaChart data={filteredHist} margin={{left:0,right:10,top:5,bottom:5}}>
              <defs><linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ci.color} stopOpacity={0.15}/><stop offset="100%" stopColor={ci.color} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
              <XAxis dataKey="d" tick={{fill:"#757575",fontSize:"clamp(12px, 2.5vw, 12px)"}} tickFormatter={v=>v.slice(2)} interval={selectedYear==="all"?5:0}/>
              <YAxis tick={{fill:"#757575",fontSize:"clamp(12px, 2.5vw, 12px)"}} domain={["dataMin-15","dataMax+15"]}/>
              <Tooltip content={<CTooltip/>}/>
              <ReferenceLine y={avg} stroke="#FFA012" strokeDasharray="4 4"/>
              <Area type="monotone" dataKey="r" stroke={ci.color} fill="url(#ag2)" strokeWidth={2} name={`${cur}/KRW`}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
          <div style={{background:"#F7F8FA",borderRadius:12,padding:"12px 8px",border:"1px solid #F0F1F3",overflowX:"auto"}}>
            <p style={{color:"#757575",fontSize:"clamp(12px, 3vw, 12px)",margin:"0 0 8px",fontWeight:600,paddingLeft:6}}>연도별 변동률</p>
            <ResponsiveContainer width="100%" height={180} minWidth={280}>
              <BarChart data={yearly} margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
                <XAxis dataKey="year" tick={{fill:"#757575",fontSize:"clamp(12px, 2.5vw, 12px)"}}/>
                <YAxis tick={{fill:"#757575",fontSize:"clamp(7px, 1.8vw, 8px)"}} unit="%"/>
                <Tooltip content={<CTooltip/>}/>
                <Bar dataKey="chg" name="변동률(%)" radius={[2,2,0,0]}>{yearly.map((e,i)=><Cell key={i} fill={parseFloat(e.chg)>0?"#F34646":"#00B442"} fillOpacity={0.6}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#F7F8FA",borderRadius:12,padding:"12px 8px",border:"1px solid #F0F1F3",overflowX:"auto"}}>
            <p style={{color:"#757575",fontSize:"clamp(12px, 3vw, 12px)",margin:"0 0 8px",fontWeight:600,paddingLeft:6}}>연도별 평균·범위</p>
            <ResponsiveContainer width="100%" height={180} minWidth={280}>
              <ComposedChart data={yearly} margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
                <XAxis dataKey="year" tick={{fill:"#757575",fontSize:"clamp(12px, 2.5vw, 12px)"}}/>
                <YAxis tick={{fill:"#757575",fontSize:"clamp(7px, 1.8vw, 8px)"}} domain={["dataMin-15","dataMax+15"]}/>
                <Tooltip content={<CTooltip/>}/>
                <Line type="monotone" dataKey="avg" stroke={ci.color} strokeWidth={2} dot={{r:2.5,fill:ci.color}} name="평균"/>
                <Line type="monotone" dataKey="min" stroke="#296CF2" strokeWidth={1} strokeDasharray="3 3" dot={false} name="최저"/>
                <Line type="monotone" dataKey="max" stroke="#F34646" strokeWidth={1} strokeDasharray="3 3" dot={false} name="최고"/>
                <Legend wrapperStyle={{fontSize:"clamp(12px, 2.5vw, 12px)"}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{background:"#F7F8FA",borderRadius:14,padding:"16px",border:"1px solid #F0F1F3"}}>
          <h3 style={{color:"#222222",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700,margin:"0 0 10px"}}>환율 분석 활용 가이드</h3>
          <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3.2vw, 13px)",lineHeight:1.8,margin:"0 0 10px"}}>
            환율은 경제 상황, 금리 차이, 국제 무역 수지 등 다양한 요인에 의해 변동합니다.
            위 차트의 <strong style={{color:"#FFA012"}}>노란 점선</strong>은 장기 평균을 나타내며,
            현재 환율이 평균보다 낮으면 해외송금(원화→외화)에 유리하고,
            평균보다 높으면 해외에서 돈을 받는(외화→원화) 데 유리합니다.
          </p>
          <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3.2vw, 13px)",lineHeight:1.8,margin:"0 0 10px"}}>
            <strong style={{color:"#222222"}}>유학비·생활비 송금 타이밍:</strong>{" "}
            급하지 않다면 환율이 평균 이하일 때 송금하는 것이 유리합니다.
            반대로 해외 급여를 한국으로 보내는 경우, 환율이 평균 이상일 때가 더 많은 원화를 받을 수 있습니다.
          </p>
          <p style={{color:"#757575",fontSize:"clamp(11px, 2.8vw, 12px)",lineHeight:1.6,margin:0}}>
            환율 데이터는 ECB(유럽중앙은행) 공시 기준환율과 open.er-api.com의 중간시장 환율을 사용합니다.
            과거 데이터가 미래 환율을 보장하지 않으며, 투자 조언이 아닙니다.
          </p>
        </div>

        <AdSenseAd slot="1122334455" format="auto" responsive={true} style={{ minHeight: 90 }} />
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  // TAB: TIMING
  // ═══════════════════════════════════════════════════
  const TimingTab = () => {
    const recentWithRate = recentSeasonalData.filter(m=>m.rate!==null);
    const bestSendRecent=[...recentWithRate].sort((a,b)=>a.rate-b.rate).slice(0,3);
    const bestRecvRecent=[...recentWithRate].sort((a,b)=>b.rate-a.rate).slice(0,3);
    const trendColor = recentTrend.pct>0?"#F34646":recentTrend.pct<0?"#00B442":"#757575";
    const trendArrow = recentTrend.pct>0?"↑":recentTrend.pct<0?"↓":"→";
    const periodLabel = recentHist.length>=2 ? `${recentHist[0].d} ~ ${recentHist[recentHist.length-1].d}` : "";
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {["outbound","inbound"].map(d=>(
            <button key={d} onClick={()=>setDirection(d)} aria-pressed={direction===d} style={{
              padding:"10px 14px",borderRadius:12,border:"none",cursor:"pointer",
              background:direction===d?"#E5E7EB":"#F7F8FA",
              color:direction===d?"#222222":"#949494",fontSize:"clamp(14px, 3.5vw, 14px)",fontWeight:600,
              flex:"1 0 auto",minHeight:44,
            }}>{d==="outbound"?"🇰🇷→ 해외송금":"→🇰🇷 수취"}</button>
          ))}
          <div style={{flex:"1 1 100%",marginTop:8}}><CurPicker/></div>
        </div>

        {/* 시그널 카드 - 1년 기준 */}
        <div style={{padding:"14px 16px",borderRadius:12,background:`${sig.c}08`,border:`1px solid ${sig.c}18`,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:"clamp(28px, 8vw, 32px)",flexShrink:0}}>{sig.i}</span>
          <div style={{minWidth:0,flex:1}}>
            <p style={{color:sig.c,margin:0,fontSize:"clamp(18px, 5vw, 20px)",fontWeight:800}}>{sig.s}</p>
            <p style={{color:"#757575",margin:"2px 0 0",fontSize:"clamp(11px, 2.8vw, 12px)",lineHeight:1.4}}>
              {ci.flag} {cur} 현재 ₩{curRate.toLocaleString()} · 1년 평균 ₩{recent1YAvg.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 1년 핵심 지표 카드 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"#F7F8FA",borderRadius:10,padding:"10px 12px",border:"1px solid #F0F1F3"}}>
            <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0}}>1년 추세</p>
            <p style={{color:trendColor,fontSize:"clamp(16px, 4.5vw, 18px)",margin:"4px 0 0",fontWeight:800,fontFamily:"Roboto, 'Noto Sans', sans-serif"}}>{trendArrow} {recentTrend.pct>0?"+":""}{recentTrend.pct}%</p>
          </div>
          <div style={{background:"#F7F8FA",borderRadius:10,padding:"10px 12px",border:"1px solid #F0F1F3"}}>
            <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0}}>현재 위치</p>
            <p style={{color:percentilePos>=70?"#F34646":percentilePos<=30?"#00B442":"#FFA012",fontSize:"clamp(16px, 4.5vw, 18px)",margin:"4px 0 0",fontWeight:800,fontFamily:"Roboto, 'Noto Sans', sans-serif"}}>
              상위 {100-percentilePos}%
            </p>
          </div>
          <div style={{background:"#F7F8FA",borderRadius:10,padding:"10px 12px",border:"1px solid #F0F1F3"}}>
            <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0}}>1년 최저</p>
            <p style={{color:"#296CF2",fontSize:"clamp(14px, 3.8vw, 16px)",margin:"4px 0 0",fontWeight:700,fontFamily:"Roboto, 'Noto Sans', sans-serif"}}>₩{recent1YMin.toLocaleString()}</p>
          </div>
          <div style={{background:"#F7F8FA",borderRadius:10,padding:"10px 12px",border:"1px solid #F0F1F3"}}>
            <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0}}>1년 최고</p>
            <p style={{color:"#F34646",fontSize:"clamp(14px, 3.8vw, 16px)",margin:"4px 0 0",fontWeight:700,fontFamily:"Roboto, 'Noto Sans', sans-serif"}}>₩{recent1YMax.toLocaleString()}</p>
          </div>
        </div>

        {/* 현재 위치 바 */}
        <div style={{background:"#F7F8FA",borderRadius:10,padding:"12px 14px",border:"1px solid #F0F1F3"}}>
          <p style={{color:"#757575",fontSize:"clamp(11px, 2.8vw, 12px)",margin:"0 0 8px",fontWeight:600}}>1년 범위 내 현재 위치</p>
          <div style={{position:"relative",height:24,background:"#E5E7EB",borderRadius:6,overflow:"hidden"}}>
            <div style={{
              position:"absolute",left:0,top:0,height:"100%",borderRadius:6,
              width:`${recent1YMax>recent1YMin?((curRate-recent1YMin)/(recent1YMax-recent1YMin)*100):50}%`,
              background:`linear-gradient(90deg, #00B442, #FFA012, #F34646)`,opacity:0.3,
            }}/>
            <div style={{
              position:"absolute",top:"50%",transform:"translate(-50%,-50%)",
              left:`${recent1YMax>recent1YMin?Math.min(Math.max(((curRate-recent1YMin)/(recent1YMax-recent1YMin)*100),2),98):50}%`,
              width:10,height:10,borderRadius:"50%",background:"#222222",boxShadow:"0 0 6px rgba(0,0,0,0.2)",
            }}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{color:"#296CF2",fontSize:"clamp(10px, 2.5vw, 11px)",fontFamily:"Roboto, 'Noto Sans', sans-serif"}}>₩{recent1YMin.toLocaleString()}</span>
            <span style={{color:"#F34646",fontSize:"clamp(10px, 2.5vw, 11px)",fontFamily:"Roboto, 'Noto Sans', sans-serif"}}>₩{recent1YMax.toLocaleString()}</span>
          </div>
        </div>

        {/* 최근 1년 월별 추이 차트 */}
        <div style={{background:"#F7F8FA",borderRadius:12,padding:"12px 8px",border:"1px solid #F0F1F3"}}>
          <p style={{color:"#757575",fontSize:"clamp(11px, 2.8vw, 12px)",margin:"0 0 6px 8px",fontWeight:600}}>최근 1년 월별 추이 ({periodLabel})</p>
          <div style={{overflowX:"auto"}}>
            <ResponsiveContainer width="100%" height={220} minWidth={300}>
              <ComposedChart data={recentHist.map(d=>({...d,label:d.d.split("-")[1]+"월"}))} margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
                <XAxis dataKey="label" tick={{fill:"#757575",fontSize:"clamp(11px, 2.5vw, 12px)"}}/>
                <YAxis tick={{fill:"#757575",fontSize:"clamp(7px, 1.8vw, 8px)"}} domain={["dataMin-15","dataMax+15"]}/>
                <Tooltip content={<CTooltip/>}/>
                <Area type="monotone" dataKey="r" stroke={ci.color} fill={ci.color} fillOpacity={0.08} strokeWidth={2} name="환율"/>
                <ReferenceLine y={recent1YAvg} stroke="#FFA012" strokeDasharray="4 4" label={{value:"1Y 평균",fill:"#FFA012",fontSize:10,position:"insideTopRight"}}/>
                <ReferenceLine y={curRate} stroke="#222222" strokeDasharray="2 2" strokeWidth={1}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 전월 대비 변화 */}
        <div style={{background:"#F7F8FA",borderRadius:12,padding:"12px 8px",border:"1px solid #F0F1F3"}}>
          <p style={{color:"#757575",fontSize:"clamp(11px, 2.8vw, 12px)",margin:"0 0 6px 8px",fontWeight:600}}>전월 대비 변화율</p>
          <div style={{overflowX:"auto"}}>
            <ResponsiveContainer width="100%" height={160} minWidth={300}>
              <BarChart data={recentHist.slice(1).map((d,i)=>{
                const prev=recentHist[i].r;
                const chg=Math.round((d.r-prev)/prev*10000)/100;
                return {label:d.d.split("-")[1]+"월",change:chg};
              })} margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
                <XAxis dataKey="label" tick={{fill:"#757575",fontSize:"clamp(11px, 2.5vw, 12px)"}}/>
                <YAxis tick={{fill:"#757575",fontSize:"clamp(7px, 1.8vw, 8px)"}} tickFormatter={v=>`${v}%`}/>
                <Tooltip content={<CTooltip/>} formatter={v=>[`${v}%`,"변화율"]}/>
                <ReferenceLine y={0} stroke="#E5E7EB"/>
                <Bar dataKey="change" name="변화율" radius={[2,2,0,0]}>
                  {recentHist.slice(1).map((d,i)=>{
                    const prev=recentHist[i].r;
                    const chg=d.r-prev;
                    return <Cell key={i} fill={chg>0?"rgba(243,70,70,0.5)":"rgba(0,180,66,0.5)"}/>;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BEST 월 - 1년 기준 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{t:"송금 BEST",sub:"환율 낮은 달",d:bestSendRecent,icon:"📤"},{t:"수취 BEST",sub:"환율 높은 달",d:bestRecvRecent,icon:"📥"}].map((sec,si)=>(
            <div key={si} style={{background:"#F7F8FA",borderRadius:12,padding:"12px 14px",border:"1px solid #F0F1F3"}}>
              <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3vw, 13px)",margin:"0 0 8px",fontWeight:700}}>{sec.icon} {sec.t}</p>
              <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 10px)",margin:"-4px 0 8px"}}>{sec.sub}</p>
              {sec.d.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",borderRadius:6,marginBottom:4,background:"#FFFFFF",alignItems:"center",border:"1px solid #F0F1F3"}}>
                  <span style={{color:"#4C4C4C",fontSize:"clamp(12px, 3vw, 13px)",fontWeight:600}}>{["🥇","🥈","🥉"][i]} {m.label}</span>
                  <span style={{color:"#222222",fontSize:"clamp(12px, 3vw, 13px)",fontWeight:700,fontFamily:"Roboto, 'Noto Sans', sans-serif",whiteSpace:"nowrap"}}>₩{m.rate.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 분석 요약 */}
        <div style={{background:"#F7F8FA",borderRadius:12,padding:"14px 16px",border:"1px solid #F0F1F3"}}>
          <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3vw, 13px)",margin:0,fontWeight:700}}>📊 1년 패턴 분석 요약</p>
          <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
            <p style={{color:"#757575",fontSize:"clamp(11px, 2.8vw, 12px)",margin:0,lineHeight:1.6}}>
              {direction==="outbound"
                ? curRate <= recent1YAvg
                  ? `현재 환율(₩${curRate.toLocaleString()})이 1년 평균(₩${recent1YAvg.toLocaleString()}) 이하로, 해외송금에 유리한 시점입니다. 1년간 ${recentTrend.pct>0?"상승":"하락"} 추세(${recentTrend.pct>0?"+":""}${recentTrend.pct}%)를 보이고 있습니다.`
                  : `현재 환율(₩${curRate.toLocaleString()})이 1년 평균(₩${recent1YAvg.toLocaleString()}) 대비 높은 수준입니다. 환율 하락을 기다리거나 분할 송금을 고려해보세요.`
                : curRate >= recent1YAvg
                  ? `현재 환율(₩${curRate.toLocaleString()})이 1년 평균(₩${recent1YAvg.toLocaleString()}) 이상으로, 해외에서 수취하기 유리한 시점입니다.`
                  : `현재 환율(₩${curRate.toLocaleString()})이 1년 평균(₩${recent1YAvg.toLocaleString()}) 이하입니다. 가능하다면 환율 상승 시점까지 대기를 권장합니다.`
              }
            </p>
            <p style={{color:"#949494",fontSize:"clamp(10px, 2.5vw, 10px)",margin:0}}>※ 최근 1년({periodLabel}) 데이터 기준 · 투자 조언이 아닙니다</p>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  // TAB: MULTI
  // ═══════════════════════════════════════════════════
  const MultiTab = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div role="group" aria-label="통화 선택" style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {Object.entries(CURRENCIES).map(([code,info])=>(
          <button key={code} onClick={()=>setMultiCur(prev=>prev.includes(code)?prev.filter(c=>c!==code):[...prev,code])} aria-pressed={multiCur.includes(code)} style={{
            padding:"8px 10px",borderRadius:10,border:"none",cursor:"pointer",
            background:multiCur.includes(code)?"#E5E7EB":"#F7F8FA",
            color:multiCur.includes(code)?"#222222":"#949494",fontSize:"clamp(12px, 3vw, 12px)",fontWeight:600,
            outline:multiCur.includes(code)?`1px solid ${info.color}`:"none",
            flex:"0 0 auto",minHeight:36,
          }}>{info.flag} {code}</button>
        ))}
      </div>
      <div style={{background:"#F7F8FA",borderRadius:12,padding:"12px 8px",border:"1px solid #F0F1F3",overflowX:"auto"}}>
        <p style={{color:"#757575",fontSize:"clamp(12px, 3vw, 12px)",margin:"0 0 8px",fontWeight:600,paddingLeft:4}}>정규화 지수 (2020-01=100)</p>
        <ResponsiveContainer width="100%" height={280} minWidth={300}>
          <LineChart data={(()=>{
            const dates=HIST.USD.map(d=>d.d);
            return dates.map((date,i)=>{const pt={date};multiCur.forEach(code=>{const h=HIST[code];if(h&&h[0]&&h[i])pt[code]=Math.round((h[i].r/h[0].r)*10000)/100;});return pt;});
          })()} margin={{left:0,right:10,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
            <XAxis dataKey="date" tick={{fill:"#757575",fontSize:"clamp(7px, 1.8vw, 8px)"}} tickFormatter={v=>v.slice(2)} interval={5}/>
            <YAxis tick={{fill:"#757575",fontSize:"clamp(7px, 1.8vw, 8px)"}} domain={["dataMin-3","dataMax+3"]}/>
            <Tooltip content={<CTooltip/>}/>
            <ReferenceLine y={100} stroke="#E5E7EB" strokeDasharray="3 3"/>
            {multiCur.map(code=><Line key={code} type="monotone" dataKey={code} stroke={CURRENCIES[code].color} strokeWidth={2} dot={false} name={`${CURRENCIES[code].flag} ${code}`}/>)}
            <Legend wrapperStyle={{fontSize:"clamp(12px, 2.5vw, 12px)"}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:"#F7F8FA",borderRadius:12,padding:"10px 8px",border:"1px solid #F0F1F3",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{width:"100%",minWidth:550,borderCollapse:"separate",borderSpacing:"0 2px"}}>
          <thead><tr>{["통화","현재","5년 평균","최저","최고","편차","시그널"].map(h=><th key={h} style={{color:"#949494",fontSize:"clamp(12px, 3vw, 12px)",fontWeight:600,padding:"6px 7px",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{Object.entries(CURRENCIES).map(([code,info])=>{
            const h=HIST[code]||[];const lr=info.base;const a=h.length?Math.round(h.reduce((s,d)=>s+d.r,0)/h.length):0;const n=h.length?Math.min(...h.map(d=>d.r)):0;const x=h.length?Math.max(...h.map(d=>d.r)):0;const sg=getSignal(lr,a);
            return(<tr key={code}><td style={{padding:"8px 7px",whiteSpace:"nowrap"}}><span style={{fontSize:"clamp(14px, 3.5vw, 14px)"}}>{info.flag}</span> <span style={{color:"#222222",fontSize:"clamp(12px, 3vw, 12px)",fontWeight:600}}>{code}</span></td><td style={{color:"#222222",fontSize:"clamp(14px, 3.5vw, 14px)",fontWeight:700,padding:"8px 7px",fontFamily:"Roboto, 'Noto Sans', sans-serif",whiteSpace:"nowrap"}}>₩{lr.toLocaleString()}</td><td style={{color:"#4C4C4C",fontSize:"clamp(12px, 3vw, 12px)",padding:"8px 7px",whiteSpace:"nowrap"}}>₩{a.toLocaleString()}</td><td style={{color:"#296CF2",fontSize:"clamp(12px, 3vw, 12px)",padding:"8px 7px",whiteSpace:"nowrap"}}>₩{n.toLocaleString()}</td><td style={{color:"#F34646",fontSize:"clamp(12px, 3vw, 12px)",padding:"8px 7px",whiteSpace:"nowrap"}}>₩{x.toLocaleString()}</td><td style={{color:(lr-a)>0?"#F34646":"#00B442",fontSize:"clamp(12px, 3vw, 12px)",fontWeight:600,padding:"8px 7px",whiteSpace:"nowrap"}}>{a?((lr-a)/a*100).toFixed(1):0}%</td><td style={{padding:"8px 7px",whiteSpace:"nowrap"}}><span style={{color:sg.c,fontSize:"clamp(12px, 3vw, 12px)",fontWeight:600}}>{sg.i} {sg.s}</span></td></tr>);
          })}</tbody>
        </table>
      </div>

      <div style={{background:"#F7F8FA",borderRadius:14,padding:"16px",border:"1px solid #F0F1F3"}}>
        <h3 style={{color:"#222222",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700,margin:"0 0 10px"}}>다중 통화 분석이란?</h3>
        <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3.2vw, 13px)",lineHeight:1.8,margin:"0 0 10px"}}>
          위 정규화 지수(2020년 1월 = 100)는 각 통화가 원화 대비 얼마나 강세/약세로 움직였는지를 한눈에 보여줍니다.
          지수가 100 이상이면 2020년 초 대비 원화가 약세(해외송금 비용 증가), 100 미만이면 원화가 강세(해외송금 비용 감소)입니다.
        </p>
        <p style={{color:"#4C4C4C",fontSize:"clamp(12px, 3.2vw, 13px)",lineHeight:1.8,margin:"0 0 10px"}}>
          <strong style={{color:"#222222"}}>활용 예시:</strong>{" "}
          미국과 일본에 동시에 송금해야 하는 경우, USD 지수는 높은데 JPY 지수가 낮다면
          일본 송금을 먼저 하고 미국 송금은 환율이 내려올 때 하는 전략을 세울 수 있습니다.
          편차(%) 값이 클수록 현재 환율이 장기 평균에서 많이 벗어나 있다는 의미입니다.
        </p>
        <p style={{color:"#757575",fontSize:"clamp(11px, 2.8vw, 12px)",lineHeight:1.6,margin:0}}>
          모든 데이터는 정보 제공 목적이며, 환율 예측이나 투자 권유가 아닙니다.
        </p>
      </div>

      <AdSenseAd slot="0987654321" format="auto" responsive={true} style={{ minHeight: 90 }} />
    </div>
  );

  // ═══════════════════════════════════════════════════
  // PAGE ROUTING
  // ═══════════════════════════════════════════════════
  if (page === "about") {
    return <AboutPage onBack={() => navigate("/")} />;
  }

  if (page === "privacy") {
    return <PrivacyPage onBack={() => navigate("/")} />;
  }

  if (page === "blog") {
    return <BlogListPage posts={posts} navigate={navigate} />;
  }

  if (page === "blogPost") {
    return <BlogPostPage slug={route.slug} posts={posts} navigate={navigate} />;
  }

  // ═══════════════════════════════════════════════════
  // MAIN PAGE
  // ═══════════════════════════════════════════════════
  return (
    <div style={{minHeight:"100vh",background:c.bgPrimary,color:c.text,fontFamily:fonts.primary,letterSpacing:tracking.default,overflowX:"hidden",transition:"background 0.3s, color 0.3s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div style={{borderBottom:`1px solid ${c.borderLight}`,padding:"12px 16px 0"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flex:"1 1 auto",minWidth:0}}>
              <span style={{fontSize:"clamp(22px, 5vw, 26px)"}}>⚖️</span>
              <div style={{minWidth:0}}>
                <h1 style={{margin:0,fontSize:"clamp(16px, 4vw, 18px)",fontWeight:800,letterSpacing:tracking.display}}>{t("header.title")}</h1>
                <p style={{color:c.textDark,fontSize:"clamp(12px, 3vw, 12px)",margin:0}}>{t("header.subtitle")}</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
              {/* Dark/Light 토글 */}
              <button onClick={()=>{toggle();trackEvent("theme_toggle",{to:mode==="dark"?"light":"dark"});}} aria-label="Toggle theme"
                style={{
                  display:"flex",alignItems:"center",justifyContent:"center",
                  width:36,height:36,borderRadius:8,border:`1px solid ${c.border}`,
                  background:"transparent",color:c.text,fontSize:18,
                  cursor:"pointer",transition:"all 0.2s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.background=c.bgCardHover;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
              >{mode==="dark"?"☀️":"🌙"}</button>
              {/* 언어 선택 */}
              <div style={{position:"relative"}}>
                <button onClick={()=>setLangOpen(!langOpen)} aria-label="Language"
                  style={{
                    display:"flex",alignItems:"center",gap:4,
                    padding:"8px 10px",borderRadius:8,border:`1px solid ${c.border}`,
                    background:"transparent",color:c.text,
                    fontSize:"clamp(12px, 3vw, 13px)",fontWeight:600,
                    cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=c.bgCardHover;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
                >🌐 {LANG_META[lang].label} ▾</button>
                {langOpen && (
                  <>
                    <div onClick={()=>setLangOpen(false)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9998}} />
                    <div style={{
                      position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:9999,
                      background:c.bgCard,border:`1px solid ${c.border}`,borderRadius:10,
                      overflow:"hidden",minWidth:130,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",
                    }}>
                      {SUPPORTED.map(l=>(
                        <button key={l} onClick={()=>{setLang(l);setLangOpen(false);trackEvent("lang_change",{to:l});}}
                          style={{
                            display:"flex",alignItems:"center",gap:8,width:"100%",
                            padding:"10px 14px",border:"none",cursor:"pointer",
                            background:lang===l?c.accentBg:"transparent",
                            color:lang===l?c.accent:c.text,
                            fontSize:13,fontWeight:lang===l?700:400,
                            textAlign:"left",transition:"background 0.15s",
                          }}
                          onMouseEnter={e=>{if(lang!==l)e.currentTarget.style.background=c.bgCardHover;}}
                          onMouseLeave={e=>{if(lang!==l)e.currentTarget.style.background="transparent";}}
                        >
                          <span style={{fontSize:16}}>{LANG_META[l].flag}</span>
                          {LANG_META[l].name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <nav aria-label="tabs" style={{display:"flex",gap:2,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none"}}>
            <style>{`.tab-container::-webkit-scrollbar { display: none; }`}</style>
            <div className="tab-container" role="tablist" style={{display:"flex",gap:2,minWidth:"100%"}}>
              {tabs.map(tb=>(
                <button key={tb.id} role="tab" aria-selected={tab===tb.id} onClick={()=>{
                  trackEvent('tab_change', { from_tab: tab, to_tab: tb.id });
                  setTab(tb.id);
                }} style={{
                  padding:"10px 12px",borderRadius:"6px 6px 0 0",border:"none",cursor:"pointer",
                  background:tab===tb.id?c.bgCard:"transparent",
                  color:tab===tb.id?c.text:c.textDark,fontSize:"clamp(14px, 3.5vw, 14px)",fontWeight:tab===tb.id?700:500,
                  borderBottom:tab===tb.id?`2px solid ${c.accent}`:"2px solid transparent",
                  transition:"all 0.15s",whiteSpace:"nowrap",flex:"1 0 auto",minHeight:44,
                }}>{tb.icon} {tb.label}</button>
              ))}
            </div>
          </nav>
        </div>
      </div>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"14px 16px 32px"}}>
        <div role="tabpanel" style={{display: tab==="compare" ? "block" : "none"}}>{compareContent}</div>
        <div role="tabpanel" style={{display: tab==="rate" ? "block" : "none"}}><RateTab/></div>
        <div role="tabpanel" style={{display: tab==="timing" ? "block" : "none"}}><TimingTab/></div>
        <div role="tabpanel" style={{display: tab==="multi" ? "block" : "none"}}><MultiTab/></div>
      </main>
      {posts.length > 0 && (
        <section aria-label="해외송금 인사이트" style={{maxWidth:1100,margin:"0 auto",padding:"20px 16px 8px"}}>
          <h2 style={{color:"#222222",fontSize:"clamp(15px,4vw,17px)",fontWeight:700,margin:"0 0 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>📝</span> 해외송금 인사이트
          </h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {posts.slice(0,5).map(post => (
              <a key={post.id} href={`/blog/${post.slug}`}
                onClick={(e)=>{e.preventDefault();navigate(`/blog/${post.slug}`)}}
                style={{display:"block",padding:"14px 16px",borderRadius:12,background:"#F7F8FA",border:"1px solid #E5E7EB",textDecoration:"none",color:"inherit",transition:"background 0.2s,border-color 0.2s"}}
                onMouseEnter={(e)=>{e.currentTarget.style.background="#EFF0F3";e.currentTarget.style.borderColor="#D1D5DB"}}
                onMouseLeave={(e)=>{e.currentTarget.style.background="#F7F8FA";e.currentTarget.style.borderColor="#E5E7EB"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:11,color:"#296CF2",fontWeight:600,background:"rgba(41,108,242,0.08)",padding:"2px 8px",borderRadius:4}}>{post.category}</span>
                  <span style={{fontSize:11,color:"#949494",whiteSpace:"nowrap"}}>{post.date}</span>
                </div>
                <p style={{margin:0,color:"#222222",fontWeight:600,fontSize:"clamp(13px,3.5vw,14px)",lineHeight:1.5}}>{post.title}</p>
                {post.summary && (
                  <p style={{margin:"6px 0 0",color:"#757575",fontSize:"clamp(12px,3vw,13px)",lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{post.summary}</p>
                )}
              </a>
            ))}
            <button onClick={()=>navigate("/blog")} style={{display:"block",width:"100%",padding:"12px",borderRadius:10,background:"rgba(41,108,242,0.08)",border:"1px solid rgba(41,108,242,0.2)",color:"#296CF2",fontSize:"clamp(13px,3.5vw,14px)",fontWeight:600,cursor:"pointer",textAlign:"center",transition:"background 0.2s",marginTop:4}} onMouseEnter={(e)=>e.target.style.background="rgba(41,108,242,0.12)"} onMouseLeave={(e)=>e.target.style.background="rgba(41,108,242,0.08)"}>모든 글 보기 →</button>
          </div>
        </section>
      )}

      <footer style={{borderTop:"1px solid #F0F1F3",padding:"12px 16px",textAlign:"center"}}>
        <p style={{color:"#B0B0B0",fontSize:"clamp(12px, 3vw, 12px)",margin:0,lineHeight:1.5}}>⚖️ 환율 API + Wise 비교 API · 자동 갱신 · 운영비 $0</p>
        <p style={{color:"#949494",fontSize:"clamp(12px, 3vw, 12px)",margin:"6px 0 0",lineHeight:1.5}}>
          문의: <a href="mailto:the@designer-kyungho.com" style={{color:"#757575",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={(e) => e.target.style.color="#4C4C4C"} onMouseLeave={(e) => e.target.style.color="#757575"}>the@designer-kyungho.com</a>
        </p>
        <p style={{margin:"6px 0 0"}}>
          <button onClick={() => navigate("/about")} style={{background:"none",border:"none",color:"#949494",fontSize:"clamp(11px, 2.8vw, 12px)",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,padding:0,transition:"color 0.2s",marginRight:16}} onMouseEnter={(e) => e.target.style.color="#757575"} onMouseLeave={(e) => e.target.style.color="#949494"}>서비스 소개</button>
          <button onClick={() => navigate("/blog")} style={{background:"none",border:"none",color:"#949494",fontSize:"clamp(11px, 2.8vw, 12px)",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,padding:0,transition:"color 0.2s",marginRight:16}} onMouseEnter={(e) => e.target.style.color="#757575"} onMouseLeave={(e) => e.target.style.color="#949494"}>블로그</button>
          <button onClick={() => navigate("/privacy")} style={{background:"none",border:"none",color:"#949494",fontSize:"clamp(11px, 2.8vw, 12px)",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,padding:0,transition:"color 0.2s"}} onMouseEnter={(e) => e.target.style.color="#757575"} onMouseLeave={(e) => e.target.style.color="#949494"}>개인정보 보호정책</button>
        </p>
      </footer>
    </div>
  );
}
