import { useState, useEffect } from "react";

const CONSENT_KEY = "cookie_consent_v1";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // 약간 지연 후 표시 (페이지 로드 후)
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    // GA/AdSense 이미 로드됨 — 동의 이벤트 기록
    if (window.gtag) {
      window.gtag("event", "cookie_consent", { action: "accepted" });
    }
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
    if (window.gtag) {
      window.gtag("event", "cookie_consent", { action: "declined" });
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="쿠키 사용 동의"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "rgba(12,12,16,0.97)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        padding: "16px",
        animation: "slideUpBanner 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideUpBanner {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <p style={{
            color: "#E4E4E7",
            fontSize: "clamp(13px, 3.2vw, 14px)",
            margin: 0,
            lineHeight: 1.6,
          }}>
            🍪 이 웹사이트는 서비스 개선과 맞춤 광고 제공을 위해 쿠키를 사용합니다.{" "}
            <a
              href="/privacy"
              style={{ color: "#60A5FA", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              개인정보 보호정책
            </a>
            에서 자세한 내용을 확인하세요.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleDecline}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#71717A",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            거부
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "#3B82F6",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
};
