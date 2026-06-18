import { useRef, useEffect } from "react";

export const AdSenseAd = ({ slot, format = "auto", responsive = true, style = {} }) => {
  const adRef = useRef(null);

  useEffect(() => {
    if (adRef.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  return (
    <aside aria-label="광고" style={{
      margin: "20px 0",
      padding: "12px",
      background: "rgba(255,255,255,0.02)",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.04)",
      minHeight: 100,
      overflow: "hidden",
      ...style
    }}>
      <p style={{
        color: "#3F3F46",
        fontSize: 10,
        margin: "0 0 6px",
        textAlign: "center",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        광고
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-1792554171041608"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive.toString()}
        />
      </div>
    </aside>
  );
};
