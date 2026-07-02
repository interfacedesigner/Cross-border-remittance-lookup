import { Component } from "react";
import { trackEvent } from "../utils/analytics";
import { getColors, fonts, fontWeight as fw, lineHeight as lh, radius, typeScale } from "../styles/theme";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
    trackEvent("error_boundary", {
      error_message: error?.message || "Unknown",
      component_stack: errorInfo?.componentStack?.slice(0, 200) || "",
    });
  }

  render() {
    if (this.state.hasError) {
      const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      const c = getColors(isDark ? "dark" : "light");
      return (
        <div style={{minHeight:"100vh",background:c.bgPrimary,color:c.text,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,fontFamily:fonts.primary,textAlign:"center"}}>
          <p style={{fontSize:typeScale["5xl"],margin:"0 0 16px"}}>⚠️</p>
          <h1 style={{fontSize:typeScale["2xl"],fontWeight:fw.bold,margin:"0 0 8px"}}>오류가 발생했습니다</h1>
          <p style={{color:c.textDim,margin:"0 0 24px",fontSize:typeScale.lg,lineHeight:lh.loose}}>
            일시적인 문제가 발생했습니다.<br/>페이지를 새로고침해 주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{padding:"12px 28px",borderRadius:radius.xl,background:c.accentBg,border:`1px solid ${c.accentBorder}`,color:c.accent,fontSize:15,fontWeight:fw.semibold,cursor:"pointer"}}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
