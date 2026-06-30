import { useRef, useEffect } from "react";
import { useTheme } from "../utils/useTheme";

export const AdSenseAd = ({ slot, format = "auto", responsive = true, style = {} }) => {
  const { c } = useTheme();
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
      background: c.bgCard,
      borderRadius: 12,
      border: `1px solid ${c.border}`,
      minHeight: 100,
      overflow: "hidden",
      ...style
    }}>
      <p style={{
        color: c.textDarker,
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
