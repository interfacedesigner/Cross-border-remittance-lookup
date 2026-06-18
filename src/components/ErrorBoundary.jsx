import { Component } from "react";
import { trackEvent } from "../utils/analytics";

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
      return (
        <div style={{minHeight:"100vh",background:"#09090B",color:"#E4E4E7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,fontFamily:"'Pretendard',-apple-system,sans-serif",textAlign:"center"}}>
          <p style={{fontSize:48,margin:"0 0 16px"}}>⚠️</p>
          <h1 style={{fontSize:20,fontWeight:700,margin:"0 0 8px"}}>오류가 발생했습니다</h1>
          <p style={{color:"#71717A",margin:"0 0 24px",fontSize:14,lineHeight:1.6}}>
            일시적인 문제가 발생했습니다.<br/>페이지를 새로고침해 주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{padding:"12px 28px",borderRadius:10,background:"rgba(96,165,250,0.15)",border:"1px solid rgba(96,165,250,0.3)",color:"#60A5FA",fontSize:15,fontWeight:600,cursor:"pointer"}}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
