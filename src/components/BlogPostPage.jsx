import { useEffect } from "react";
import DOMPurify from "dompurify";
import { AdSenseAd } from "./AdSenseAd";
import { useTheme } from "../utils/useTheme";
import { fonts, fontWeight as fw, lineHeight as lh, spacing, radius, typeScale } from "../styles/theme";

const getBlogArticleStyles = (c) => `
.blog-article h1{color:${c.text};font-size:clamp(20px,5vw,24px);font-weight:800;margin:28px 0 14px;line-height:1.4}
.blog-article h2{color:${c.accent};font-size:clamp(17px,4.2vw,20px);font-weight:700;margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid ${c.border};line-height:1.4}
.blog-article h3{color:${c.text};font-size:clamp(15px,3.8vw,17px);font-weight:600;margin:22px 0 10px;line-height:1.4}
.blog-article p{color:${c.textMuted};font-size:clamp(14px,3.5vw,15px);line-height:1.85;margin:12px 0}
.blog-article ul,.blog-article ol{color:${c.textMuted};padding-left:20px;margin:10px 0}
.blog-article li{font-size:clamp(14px,3.5vw,15px);line-height:1.85;margin:6px 0}
.blog-article strong{color:${c.text}}
.blog-article a{color:${c.accent};text-decoration:underline;text-underline-offset:3px}
.blog-article blockquote{border-left:3px solid ${c.accent};padding:8px 16px;margin:16px 0;background:${c.accentBg};border-radius:0 8px 8px 0}
.blog-article blockquote p{color:${c.textMuted}}
.blog-article code{background:${c.bgLayer};padding:2px 6px;border-radius:4px;font-size:13px;color:${c.text}}
.blog-article pre{background:${c.bgLayer};padding:16px;border-radius:8px;overflow-x:auto;margin:16px 0}
.blog-article hr{border:none;border-top:1px solid ${c.border};margin:24px 0}
`;

export const BlogPostPage = ({ slug, posts, navigate }) => {
  const { c } = useTheme();
  const post = posts.find(p => p.slug === slug);
  const relatedPosts = posts.filter(p => p.slug !== slug && p.category === post?.category).slice(0, 3);

  useEffect(() => {
    let styleEl = document.getElementById("blog-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "blog-styles";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = getBlogArticleStyles(c);
    if (post) document.title = `${post.title} | 해외송금 비교`;
    return () => { document.title = "해외송금 수수료 비교 | 8개 서비스 실시간 비교"; };
  }, [post, c]);

  if (!post) return (
    <div style={{minHeight:"100vh",background:c.bgPrimary,color:c.text,fontFamily:fonts.primary,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40}}>
      <p style={{fontSize:typeScale["5xl"],margin:"0 0 16px"}}>📭</p>
      <p style={{fontSize:18,fontWeight:fw.semibold,margin:"0 0 8px"}}>포스트를 찾을 수 없습니다</p>
      <p style={{color:c.textDim,margin:"0 0 24px"}}>요청하신 글이 존재하지 않거나 삭제되었습니다.</p>
      <button onClick={()=>navigate("/blog")} style={{padding:"10px 24px",borderRadius:radius.xl,background:c.accentBg,border:`1px solid ${c.accentBorder}`,color:c.accent,fontSize:typeScale.lg,fontWeight:fw.semibold,cursor:"pointer"}}>블로그 목록으로</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:c.bgPrimary,color:c.text,fontFamily:fonts.primary}}>
      <div style={{background:c.bgCard,borderBottom:`1px solid ${c.border}`,padding:"16px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>navigate("/blog")} aria-label="블로그 목록으로" style={{background:"none",border:"none",color:c.accent,cursor:"pointer",fontSize:typeScale.lg,padding:0,display:"flex",alignItems:"center",gap:spacing.xs}}>← 블로그</button>
          <span style={{color:c.textDark,fontSize:typeScale.base}}>{post.category}</span>
          <div style={{width:60}}/>
        </div>
      </div>
      <header style={{maxWidth:800,margin:"0 auto",padding:"32px 16px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:spacing.lg,marginBottom:spacing["2xl"]}}>
          <span style={{fontSize:typeScale.base,color:c.accent,fontWeight:fw.semibold,background:c.accentBg,padding:"4px 12px",borderRadius:radius.md}}>{post.category}</span>
          <span style={{fontSize:typeScale.md,color:c.textDark}}>{post.date}</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,5.5vw,30px)",fontWeight:fw.extrabold,lineHeight:1.35,color:c.text}}>{post.title}</h1>
        {post.summary && <p style={{margin:"14px 0 0",color:c.textDim,fontSize:"clamp(14px,3.5vw,15px)",lineHeight:lh.spacious}}>{post.summary}</p>}
      </header>
      {post.contentHtml ? (
        <article className="blog-article" style={{maxWidth:800,margin:"0 auto",padding:"0 16px 40px"}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(post.contentHtml)}} />
      ) : (
        <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 40px",textAlign:"center"}}>
          <p style={{color:c.textDim,padding:40}}>본문을 불러오는 중입니다...</p>
        </div>
      )}
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 16px"}}>
        <AdSenseAd slot="5566778899" format="auto" responsive={true} style={{ minHeight: 90 }} />
      </div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 32px"}}>
        <button onClick={()=>navigate("/")} style={{display:"block",width:"100%",padding:"16px",borderRadius:radius["2xl"],background:`linear-gradient(135deg,${c.accentBgSoft},${c.accentBg})`,border:`1px solid ${c.accentBorderSoft}`,color:c.accent,fontSize:"clamp(14px,3.5vw,16px)",fontWeight:fw.bold,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}} onMouseEnter={(e)=>e.target.style.background=`linear-gradient(135deg,${c.accentBg},${c.accentBg})`} onMouseLeave={(e)=>e.target.style.background=`linear-gradient(135deg,${c.accentBgSoft},${c.accentBg})`}>⚖️ 8개 서비스 실시간 수수료 비교하기</button>
      </div>
      {relatedPosts.length > 0 && (
        <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 40px"}}>
          <h3 style={{color:c.textMuted,fontSize:15,fontWeight:fw.semibold,margin:"0 0 14px"}}>📌 관련 글</h3>
          <div style={{display:"flex",flexDirection:"column",gap:spacing.lg}}>
            {relatedPosts.map(rp => (
              <a key={rp.id} href={`/blog/${rp.slug}`} onClick={(e)=>{e.preventDefault();navigate(`/blog/${rp.slug}`)}}
                style={{display:"block",padding:"12px 16px",borderRadius:radius.xl,background:c.bgCard,border:`1px solid ${c.border}`,textDecoration:"none",color:"inherit",transition:"background 0.2s"}}
                onMouseEnter={(e)=>e.currentTarget.style.background=c.bgCardHover} onMouseLeave={(e)=>e.currentTarget.style.background=c.bgCard}>
                <p style={{margin:0,color:c.text,fontWeight:fw.semibold,fontSize:typeScale.lg}}>{rp.title}</p>
                <p style={{margin:"4px 0 0",color:c.textDark,fontSize:typeScale.base}}>{rp.date}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
