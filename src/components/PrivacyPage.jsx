import React from "react";

export const PrivacyPage = ({ onBack }) => (
  <div style={{minHeight:"100vh",background:"#FFFFFF",color:"#222222",fontFamily:"'Noto Sans', 'Noto Sans KR', sans-serif"}}>
    {/* 헤더 */}
    <div style={{background:"#F7F8FA",borderBottom:"1px solid #E5E7EB",padding:"16px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
      <div style={{maxWidth:800,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
        <button
          onClick={onBack}
          aria-label="돌아가기"
          style={{background:"#F7F8FA",border:"1px solid #E5E7EB",borderRadius:8,color:"#222222",padding:"8px 14px",cursor:"pointer",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:6,transition:"all 0.2s",whiteSpace:"nowrap"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#EFF0F3";}}
          onMouseLeave={e=>{e.currentTarget.style.background="#F7F8FA";}}
        >
          ← 돌아가기
        </button>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(16px,4vw,18px)",fontWeight:800}}>개인정보 보호정책</h1>
          <p style={{margin:0,fontSize:12,color:"#757575"}}>해외송금 수수료 비교 서비스</p>
        </div>
      </div>
    </div>

    {/* 본문 */}
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px 48px"}}>

      {/* 섹션 카드 공통 스타일 helper */}
      {[
        {
          num:"1",title:"개인정보의 수집 및 이용 목적",
          content:(
            <>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:16}}>본 웹사이트(https://cross-border-remittance-lookup.web.app/)는 이용자에게 해외송금 수수료 비교 정보를 제공하기 위해 최소한의 정보만을 수집합니다.</p>
              <p style={{color:"#222222",fontWeight:600,marginBottom:8}}>수집하는 정보</p>
              <ul style={{color:"#4C4C4C",lineHeight:2,paddingLeft:20,marginBottom:16}}>
                <li><strong style={{color:"#222222"}}>자동 수집 정보:</strong> IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 브라우저 정보</li>
                <li><strong style={{color:"#222222"}}>수집 목적:</strong> 웹사이트 분석, 서비스 개선, 광고 제공</li>
              </ul>
              <div style={{background:"rgba(41,108,242,0.06)",borderLeft:"4px solid #296CF2",borderRadius:"0 8px 8px 0",padding:"14px 16px"}}>
                <strong style={{color:"#296CF2"}}>중요:</strong>
                <span style={{color:"#4C4C4C",marginLeft:8}}>본 웹사이트는 회원가입 시스템이 없으며, 이름, 이메일, 전화번호 등 개인 식별 정보를 직접 수집하지 않습니다.</span>
              </div>
            </>
          )
        },
        {
          num:"2",title:"쿠키(Cookie) 사용",
          content:(
            <>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:16}}>본 웹사이트는 이용자의 편의와 맞춤형 서비스 제공을 위해 쿠키를 사용합니다.</p>
              <p style={{color:"#222222",fontWeight:600,marginBottom:8}}>쿠키의 사용 목적</p>
              <ul style={{color:"#4C4C4C",lineHeight:2,paddingLeft:20,marginBottom:16}}>
                <li>웹사이트 방문 및 이용 형태 파악</li>
                <li>맞춤형 광고 제공 (Google Adsense)</li>
                <li>서비스 개선 및 사용자 경험 향상</li>
              </ul>
              <p style={{color:"#222222",fontWeight:600,marginBottom:8}}>쿠키 거부 방법</p>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:8}}>이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다:</p>
              <ul style={{color:"#4C4C4C",lineHeight:2,paddingLeft:20,marginBottom:12}}>
                <li><strong style={{color:"#222222"}}>Chrome:</strong> 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
                <li><strong style={{color:"#222222"}}>Safari:</strong> 환경설정 → 개인정보 보호 → 쿠키 차단</li>
                <li><strong style={{color:"#222222"}}>Firefox:</strong> 설정 → 개인정보 보호 및 보안 → 쿠키 및 사이트 데이터</li>
              </ul>
              <p style={{color:"#757575",fontSize:13,fontStyle:"italic"}}>단, 쿠키 설치를 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.</p>
            </>
          )
        },
        {
          num:"3",title:"제3자 정보 공유 - Google Adsense",
          content:(
            <>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:16}}>본 웹사이트는 광고 게재를 위해 <strong style={{color:"#222222"}}>Google Adsense</strong>를 사용합니다.</p>
              <p style={{color:"#222222",fontWeight:600,marginBottom:8}}>Google Adsense 정보 수집</p>
              <ul style={{color:"#4C4C4C",lineHeight:2,paddingLeft:20,marginBottom:16}}>
                <li>Google은 이용자의 관심사 기반 광고 제공을 위해 쿠키를 사용합니다</li>
                <li>수집되는 정보: 방문 기록, 클릭 기록, 기기 정보</li>
                <li>Google 개인정보 처리방침: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:"#296CF2"}}>https://policies.google.com/privacy</a></li>
              </ul>
              <p style={{color:"#222222",fontWeight:600,marginBottom:8}}>맞춤 광고 설정 변경</p>
              <ul style={{color:"#4C4C4C",lineHeight:2,paddingLeft:20}}>
                <li>Google 광고 설정: <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{color:"#296CF2"}}>https://www.google.com/settings/ads</a></li>
                <li>네트워크 광고 거부: <a href="http://optout.aboutads.info" target="_blank" rel="noopener noreferrer" style={{color:"#296CF2"}}>http://optout.aboutads.info</a></li>
              </ul>
            </>
          )
        },
        {
          num:"4",title:"개인정보의 보유 및 이용 기간",
          content:(
            <>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:12}}>자동으로 수집되는 정보는 서비스 제공 기간 동안 보유되며, 다음의 경우 즉시 파기됩니다:</p>
              <ul style={{color:"#4C4C4C",lineHeight:2,paddingLeft:20}}>
                <li>이용자가 쿠키 삭제를 요청한 경우</li>
                <li>수집 및 이용 목적이 달성된 경우</li>
                <li>법령에서 정한 보존 기간이 경과한 경우</li>
              </ul>
            </>
          )
        },
        {
          num:"5",title:"이용자의 권리",
          content:(
            <>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:12}}>이용자는 다음과 같은 권리를 가집니다:</p>
              <ul style={{color:"#4C4C4C",lineHeight:2,paddingLeft:20}}>
                <li>쿠키 설정 및 삭제 권한</li>
                <li>광고 맞춤 설정 변경 권한</li>
                <li>개인정보 처리에 대한 문의 및 불만 제기 권한</li>
              </ul>
            </>
          )
        },
        {
          num:"6",title:"개인정보 보호책임자",
          content:(
            <>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:16}}>개인정보 처리에 관한 문의사항이 있으시면 아래로 연락 주시기 바랍니다:</p>
              <div style={{background:"rgba(41,108,242,0.06)",borderLeft:"4px solid #296CF2",borderRadius:"0 8px 8px 0",padding:"16px 20px",display:"flex",flexDirection:"column",gap:8}}>
                <p style={{margin:0,color:"#222222"}}><strong style={{color:"#296CF2"}}>이메일:</strong> <a href="mailto:the@designer-kyungho.com" style={{color:"#4C4C4C",textDecoration:"none"}}>the@designer-kyungho.com</a></p>
                <p style={{margin:0,color:"#222222"}}><strong style={{color:"#296CF2"}}>웹사이트:</strong> <a href="https://cross-border-remittance-lookup.web.app/" style={{color:"#4C4C4C",textDecoration:"none"}}>cross-border-remittance-lookup.web.app</a></p>
              </div>
            </>
          )
        },
        {
          num:"7",title:"개인정보 보호정책 변경",
          content:(
            <>
              <p style={{color:"#4C4C4C",lineHeight:1.8,marginBottom:16}}>본 개인정보 보호정책은 관련 법령, 정부 지침 또는 서비스 정책 변경에 따라 수정될 수 있습니다. 변경사항은 웹사이트를 통해 공지됩니다.</p>
              <p style={{color:"#757575",fontSize:13,textAlign:"right"}}>시행일자: 2026년 2월 18일</p>
            </>
          )
        },
      ].map(sec => (
        <div key={sec.num} style={{background:"#F7F8FA",border:"1px solid #E5E7EB",borderRadius:12,padding:"24px",marginBottom:12}}>
          <h2 style={{color:"#296CF2",fontSize:"clamp(15px,4vw,17px)",fontWeight:700,marginBottom:16,paddingBottom:10,borderBottom:"1px solid #E5E7EB"}}>
            {sec.num}. {sec.title}
          </h2>
          {sec.content}
        </div>
      ))}
    </div>

    {/* 푸터 */}
    <div style={{borderTop:"1px solid #E5E7EB",padding:"16px",textAlign:"center"}}>
      <p style={{color:"#B0B0B0",fontSize:12,margin:0}}>&copy; 2026 해외송금 수수료 비교. All rights reserved.</p>
      <p style={{margin:"8px 0 0",display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#296CF2",fontSize:13,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,padding:0}}>홈으로</button>
        <a href="/blog" style={{color:"#949494",fontSize:13,textDecoration:"underline",textUnderlineOffset:3}}>블로그</a>
        <a href="/about" style={{color:"#949494",fontSize:13,textDecoration:"underline",textUnderlineOffset:3}}>서비스 소개</a>
      </p>
      <p style={{color:"#B0B0B0",fontSize:11,margin:"8px 0 0"}}>문의: the@designer-kyungho.com</p>
    </div>
  </div>
);
