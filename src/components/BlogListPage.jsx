import { useState } from "react";
import { AdSenseAd } from "./AdSenseAd";
import { useTheme } from "../utils/useTheme";

const categories = ["전체", "가이드", "비교/리뷰", "팁", "뉴스", "초보자"];

export const BlogListPage = ({ posts, navigate }) => {
  const { c } = useTheme();
  const [filter, setFilter] = useState("전체");
  const filtered = filter === "전체" ? posts : posts.filter(p => p.category === filter);
  return (
    <div style={{minHeight:"100vh",background:c.bgPrimary,color:c.text,fontFamily:"'Noto Sans', 'Noto Sans KR', sans-serif"}}>
      <div style={{background:c.bgCard,borderBottom:`1px solid ${c.border}`,padding:"16px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>navigate("/")} aria-label="홈으로 돌아가기" style={{background:"none",border:"none",color:c.accent,cursor:"pointer",fontSize:14,padding:0,display:"flex",alignItems:"center",gap:4}}>← 홈으로</button>
          <h1 style={{margin:0,fontSize:"clamp(16px,4vw,18px)",fontWeight:800}}>📝 해외송금 블로그</h1>
          <div style={{width:60}}/>
        </div>
      </div>
      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px"}}>
        <p style={{color:c.textDim,fontSize:"clamp(13px,3.2vw,14px)",margin:"0 0 20px",lineHeight:1.6}}>해외송금 수수료 절약, 서비스 비교, 환율 분석 등 유용한 정보를 제공합니다.</p>
        <div role="group" aria-label="카테고리 필터" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          {categories.map(cat => (
            <button key={cat} onClick={()=>setFilter(cat)} aria-pressed={filter===cat} style={{padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",transition:"all 0.2s",background:filter===cat?`${c.accentBg}`:"transparent",color:filter===cat?c.accent:c.textDim,borderColor:filter===cat?c.accentBorder:c.borderInput}}>{cat}</button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.length === 0 && <p style={{color:c.textDark,textAlign:"center",padding:40}}>해당 카테고리의 글이 없습니다.</p>}
          {filtered.map(post => (
            <a key={post.id} href={`/blog/${post.slug}`} onClick={(e)=>{e.preventDefault();navigate(`/blog/${post.slug}`)}}
              style={{display:"block",padding:"18px 20px",borderRadius:14,background:c.bgCard,border:`1px solid ${c.border}`,textDecoration:"none",color:"inherit",transition:"background 0.2s,border-color 0.2s,transform 0.2s"}}
              onMouseEnter={(e)=>{e.currentTarget.style.background=c.bgCardHover;e.currentTarget.style.borderColor=c.borderHover;e.currentTarget.style.transform="translateY(-1px)"}}
              onMouseLeave={(e)=>{e.currentTarget.style.background=c.bgCard;e.currentTarget.style.borderColor=c.border;e.currentTarget.style.transform="translateY(0)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:11,color:c.accent,fontWeight:600,background:c.accentBg,padding:"3px 10px",borderRadius:6}}>{post.category}</span>
                <span style={{fontSize:12,color:c.textDark}}>{post.date}</span>
              </div>
              <h2 style={{margin:0,color:c.text,fontWeight:700,fontSize:"clamp(14px,3.8vw,16px)",lineHeight:1.5}}>{post.title}</h2>
              {post.summary && <p style={{margin:"8px 0 0",color:c.textDim,fontSize:"clamp(12px,3vw,13px)",lineHeight:1.7,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{post.summary}</p>}
            </a>
          ))}
        </div>
        <AdSenseAd slot="6677889900" format="auto" responsive={true} style={{ minHeight: 90 }} />
        <p style={{color:c.textDarker,fontSize:12,textAlign:"center",margin:"32px 0 0"}}>총 {filtered.length}개의 글</p>
      </div>
    </div>
  );
};
