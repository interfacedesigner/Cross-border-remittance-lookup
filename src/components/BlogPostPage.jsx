import { useEffect } from "react";
import DOMPurify from "dompurify";
import { AdSenseAd } from "./AdSenseAd";

const blogArticleStyles = `
.blog-article h1{color:#222222;font-size:clamp(20px,5vw,24px);font-weight:800;margin:28px 0 14px;line-height:1.4}
.blog-article h2{color:#296CF2;font-size:clamp(17px,4.2vw,20px);font-weight:700;margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid #E5E7EB;line-height:1.4}
.blog-article h3{color:#222222;font-size:clamp(15px,3.8vw,17px);font-weight:600;margin:22px 0 10px;line-height:1.4}
.blog-article p{color:#4C4C4C;font-size:clamp(14px,3.5vw,15px);line-height:1.85;margin:12px 0}
.blog-article ul,.blog-article ol{color:#4C4C4C;padding-left:20px;margin:10px 0}
.blog-article li{font-size:clamp(14px,3.5vw,15px);line-height:1.85;margin:6px 0}
.blog-article strong{color:#222222}
.blog-article a{color:#296CF2;text-decoration:underline;text-underline-offset:3px}
.blog-article blockquote{border-left:3px solid #296CF2;padding:8px 16px;margin:16px 0;background:rgba(41,108,242,0.05);border-radius:0 8px 8px 0}
.blog-article blockquote p{color:#4C4C4C}
.blog-article code{background:#F7F8FA;padding:2px 6px;border-radius:4px;font-size:13px;color:#222222}
.blog-article pre{background:#F7F8FA;padding:16px;border-radius:8px;overflow-x:auto;margin:16px 0}
.blog-article hr{border:none;border-top:1px solid #E5E7EB;margin:24px 0}
`;

export const BlogPostPage = ({ slug, posts, navigate }) => {
  const post = posts.find(p => p.slug === slug);
  const relatedPosts = posts.filter(p => p.slug !== slug && p.category === post?.category).slice(0, 3);

  useEffect(() => {
    if (!document.getElementById("blog-styles")) {
      const style = document.createElement("style");
      style.id = "blog-styles";
      style.textContent = blogArticleStyles;
      document.head.appendChild(style);
    }
    if (post) document.title = `${post.title} | 해외송금 비교`;
    return () => { document.title = "해외송금 수수료 비교 | 8개 서비스 실시간 비교"; };
  }, [post]);

  if (!post) return (
    <div style={{minHeight:"100vh",background:"#FFFFFF",color:"#222222",fontFamily:"'Noto Sans', 'Noto Sans KR', sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40}}>
      <p style={{fontSize:48,margin:"0 0 16px"}}>📭</p>
      <p style={{fontSize:18,fontWeight:600,margin:"0 0 8px"}}>포스트를 찾을 수 없습니다</p>
      <p style={{color:"#757575",margin:"0 0 24px"}}>요청하신 글이 존재하지 않거나 삭제되었습니다.</p>
      <button onClick={()=>navigate("/blog")} style={{padding:"10px 24px",borderRadius:10,background:"rgba(41,108,242,0.08)",border:"1px solid rgba(41,108,242,0.3)",color:"#296CF2",fontSize:14,fontWeight:600,cursor:"pointer"}}>블로그 목록으로</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#FFFFFF",color:"#222222",fontFamily:"'Noto Sans', 'Noto Sans KR', sans-serif"}}>
      <div style={{background:"#F7F8FA",borderBottom:"1px solid #E5E7EB",padding:"16px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>navigate("/blog")} aria-label="블로그 목록으로" style={{background:"none",border:"none",color:"#296CF2",cursor:"pointer",fontSize:14,padding:0,display:"flex",alignItems:"center",gap:4}}>← 블로그</button>
          <span style={{color:"#949494",fontSize:12}}>{post.category}</span>
          <div style={{width:60}}/>
        </div>
      </div>
      <header style={{maxWidth:800,margin:"0 auto",padding:"32px 16px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <span style={{fontSize:12,color:"#296CF2",fontWeight:600,background:"rgba(41,108,242,0.08)",padding:"4px 12px",borderRadius:6}}>{post.category}</span>
          <span style={{fontSize:13,color:"#949494"}}>{post.date}</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,5.5vw,30px)",fontWeight:800,lineHeight:1.35,color:"#222222"}}>{post.title}</h1>
        {post.summary && <p style={{margin:"14px 0 0",color:"#757575",fontSize:"clamp(14px,3.5vw,15px)",lineHeight:1.7}}>{post.summary}</p>}
      </header>
      {post.contentHtml ? (
        <article className="blog-article" style={{maxWidth:800,margin:"0 auto",padding:"0 16px 40px"}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(post.contentHtml)}} />
      ) : (
        <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 40px",textAlign:"center"}}>
          <p style={{color:"#757575",padding:40}}>본문을 불러오는 중입니다...</p>
        </div>
      )}
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 16px"}}>
        <AdSenseAd slot="5566778899" format="auto" responsive={true} style={{ minHeight: 90 }} />
      </div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 32px"}}>
        <button onClick={()=>navigate("/")} style={{display:"block",width:"100%",padding:"16px",borderRadius:12,background:"linear-gradient(135deg,rgba(41,108,242,0.08),rgba(139,92,246,0.08))",border:"1px solid rgba(41,108,242,0.2)",color:"#296CF2",fontSize:"clamp(14px,3.5vw,16px)",fontWeight:700,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}} onMouseEnter={(e)=>e.target.style.background="linear-gradient(135deg,rgba(41,108,242,0.15),rgba(139,92,246,0.15))"} onMouseLeave={(e)=>e.target.style.background="linear-gradient(135deg,rgba(41,108,242,0.08),rgba(139,92,246,0.08))"}>⚖️ 8개 서비스 실시간 수수료 비교하기</button>
      </div>
      {relatedPosts.length > 0 && (
        <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 40px"}}>
          <h3 style={{color:"#4C4C4C",fontSize:15,fontWeight:600,margin:"0 0 14px"}}>📌 관련 글</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {relatedPosts.map(rp => (
              <a key={rp.id} href={`/blog/${rp.slug}`} onClick={(e)=>{e.preventDefault();navigate(`/blog/${rp.slug}`)}}
                style={{display:"block",padding:"12px 16px",borderRadius:10,background:"#F7F8FA",border:"1px solid #E5E7EB",textDecoration:"none",color:"inherit",transition:"background 0.2s"}}
                onMouseEnter={(e)=>e.currentTarget.style.background="#EFF0F3"} onMouseLeave={(e)=>e.currentTarget.style.background="#F7F8FA"}>
                <p style={{margin:0,color:"#222222",fontWeight:600,fontSize:14}}>{rp.title}</p>
                <p style={{margin:"4px 0 0",color:"#949494",fontSize:12}}>{rp.date}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
