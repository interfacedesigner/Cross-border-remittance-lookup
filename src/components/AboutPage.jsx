import React from "react";

export const AboutPage = ({ onBack }) => (
  <div style={{minHeight:"100vh",background:"#09090B",color:"#E4E4E7",fontFamily:"'Pretendard','JetBrains Mono',-apple-system,sans-serif"}}>
    {/* 상단 네비게이션 */}
    <div style={{background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"16px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
      <div style={{maxWidth:1000,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
        <button
          onClick={onBack}
          aria-label="돌아가기"
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#E4E4E7",padding:"8px 14px",cursor:"pointer",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:6,transition:"all 0.2s",whiteSpace:"nowrap"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
        >← 돌아가기</button>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(16px,4vw,18px)",fontWeight:800}}>서비스 소개</h1>
          <p style={{margin:0,fontSize:12,color:"#71717A"}}>해외송금 수수료 비교</p>
        </div>
      </div>
    </div>

    {/* 히어로 */}
    <div style={{background:"linear-gradient(135deg,rgba(59,130,246,0.15) 0%,rgba(139,92,246,0.1) 100%)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"clamp(40px,8vw,80px) 16px",textAlign:"center"}}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <div style={{fontSize:"clamp(40px,10vw,64px)",marginBottom:16}}>⚖️</div>
        <h2 style={{fontSize:"clamp(22px,5vw,36px)",fontWeight:800,margin:"0 0 16px",lineHeight:1.2}}>해외송금, 편향 없이 공정하게 비교</h2>
        <p style={{color:"#A1A1AA",fontSize:"clamp(15px,3.8vw,18px)",lineHeight:1.8,margin:0}}>
          Wise, 토스, 센트비, 모인, 와이어바알리 등 8개 서비스의<br style={{display:"none"}}/>
          수수료와 환율을 한눈에 비교해 가장 유리한 송금 방법을 찾아드립니다.
        </p>
      </div>
    </div>

    <div style={{maxWidth:1000,margin:"0 auto",padding:"32px 16px 64px"}}>

      {/* 주요 기능 */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"clamp(20px,4vw,36px)",marginBottom:16}}>
        <h2 style={{color:"#60A5FA",fontSize:"clamp(18px,4.5vw,22px)",fontWeight:700,textAlign:"center",marginBottom:28}}>주요 기능</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
          {[
            {icon:"💰",title:"수수료 실시간 비교",desc:"Wise·토스·센트비·모인·와이어바알리·PayPal·하나·신한 8개 서비스의 송금 수수료를 한 화면에서 비교합니다."},
            {icon:"📊",title:"환율 스프레드 분석",desc:"각 서비스가 적용하는 환율과 스프레드(환율 마진)를 투명하게 공개해 실제 수령액을 정확히 계산합니다."},
            {icon:"📈",title:"5년 환율 히스토리",desc:"2020년부터 현재까지 USD·JPY·EUR·GBP·CNY·AUD·CAD·SGD 8개 통화의 월별 환율 데이터를 제공합니다."},
            {icon:"⏰",title:"최적 송금 시기 분석",desc:"5년 평균 대비 현재 환율 위치를 분석해 지금이 송금하기 좋은 시기인지 신호로 알려드립니다."},
            {icon:"🌍",title:"다중 통화 비교",desc:"여러 통화를 동시에 비교해 어떤 통화가 역사적으로 강세/약세인지 한눈에 파악할 수 있습니다."},
            {icon:"📱",title:"PWA 앱 설치 지원",desc:"별도 앱 설치 없이 홈 화면에 추가하면 앱처럼 사용 가능합니다. iOS Safari와 Android Chrome 모두 지원합니다."},
          ].map(f=>(
            <div key={f.title}
              style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:20,transition:"all 0.2s",cursor:"default"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(96,165,250,0.4)";e.currentTarget.style.background="rgba(59,130,246,0.05)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.background="rgba(255,255,255,0.02)";}}
            >
              <div style={{fontSize:32,marginBottom:12}}>{f.icon}</div>
              <h3 style={{color:"#E4E4E7",fontSize:"clamp(14px,3.8vw,16px)",fontWeight:700,marginBottom:8}}>{f.title}</h3>
              <p style={{color:"#A1A1AA",fontSize:"clamp(13px,3.5vw,14px)",lineHeight:1.7,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 숫자로 보는 서비스 */}
      <div style={{background:"linear-gradient(135deg,rgba(59,130,246,0.12) 0%,rgba(139,92,246,0.1) 100%)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:16,padding:"clamp(20px,4vw,36px)",marginBottom:16,textAlign:"center"}}>
        <h2 style={{color:"#E4E4E7",fontSize:"clamp(18px,4.5vw,22px)",fontWeight:700,marginBottom:28}}>숫자로 보는 서비스</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:24}}>
          {[
            {num:"8개",label:"비교 가능한 송금 서비스",sub:"Wise·토스·센트비·모인 등"},
            {num:"8종",label:"지원 통화",sub:"USD·JPY·EUR·GBP 등"},
            {num:"5년+",label:"환율 히스토리 데이터",sub:"2020년 1월부터 현재까지"},
            {num:"주 2회",label:"데이터 자동 업데이트",sub:"매주 화·목 오전 9시 KST"},
          ].map(s=>(
            <div key={s.num} style={{padding:16}}>
              <div style={{fontSize:"clamp(28px,7vw,40px)",fontWeight:800,color:"#60A5FA",marginBottom:6}}>{s.num}</div>
              <div style={{color:"#E4E4E7",fontWeight:600,fontSize:"clamp(13px,3.5vw,15px)",marginBottom:4}}>{s.label}</div>
              <div style={{color:"#71717A",fontSize:"clamp(11px,3vw,13px)"}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 왜 이 서비스를 써야 하나요 */}
      <div style={{background:"rgba(234,179,8,0.05)",border:"1px solid rgba(234,179,8,0.2)",borderLeft:"4px solid #EAB308",borderRadius:"0 12px 12px 0",padding:"clamp(20px,4vw,32px)",marginBottom:16}}>
        <h2 style={{color:"#EAB308",fontSize:"clamp(17px,4.2vw,20px)",fontWeight:700,marginBottom:20}}>왜 이 서비스를 선택해야 하나요?</h2>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            {strong:"편향 없는 공정 비교",desc:"특정 송금 서비스와 어떠한 제휴·광고 관계도 없습니다. 오직 수수료와 환율 데이터만으로 순위를 매깁니다."},
            {strong:"총 비용(수수료 + 환율 마진) 기준 정렬",desc:"수수료가 0원이어도 환율 스프레드가 높으면 손해입니다. 수수료와 스프레드를 합산한 실제 총 비용 기준으로 비교합니다."},
            {strong:"5년 환율 데이터로 타이밍 판단",desc:"단순 현재 환율 표시를 넘어 5년 평균·최저·최고 구간을 보여줘 지금 송금하는 게 유리한지 판단할 수 있습니다."},
            {strong:"회원가입 불필요·완전 무료",desc:"이메일 주소 하나 입력할 필요 없습니다. 사이트에 접속하는 순간 바로 비교가 가능합니다."},
            {strong:"주 2회 자동 갱신",desc:"GitHub Actions를 통해 매주 화요일·목요일 오전 9시(KST)에 데이터를 자동 업데이트합니다. 최신 정보를 유지합니다."},
            {strong:"오픈소스 투명 운영",desc:"서비스 코드가 GitHub에 공개되어 있어 데이터 수집 방식과 계산 로직을 누구나 확인할 수 있습니다."},
          ].map(b=>(
            <div key={b.strong} style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:14}}>
              <span style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0,marginTop:1}}>✓</span>
              <span style={{color:"#A1A1AA",fontSize:"clamp(13px,3.5vw,15px)",lineHeight:1.7}}><strong style={{color:"#E4E4E7"}}>{b.strong}:</strong> {b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 비교 대상 서비스 */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"clamp(20px,4vw,32px)",marginBottom:16}}>
        <h2 style={{color:"#60A5FA",fontSize:"clamp(17px,4.2vw,20px)",fontWeight:700,textAlign:"center",marginBottom:20}}>비교 대상 8개 서비스</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
          {[
            {name:"Wise (와이즈)",tag:"글로벌 핀테크",color:"#22C55E"},
            {name:"토스",tag:"국내 핀테크",color:"#3B82F6"},
            {name:"SentBe (센트비)",tag:"아시아 특화",color:"#8B5CF6"},
            {name:"MOIN (모인)",tag:"베트남·중국 특화",color:"#F59E0B"},
            {name:"WireBarley (와이어바알리)",tag:"수수료 무료",color:"#06B6D4"},
            {name:"PayPal (페이팔)",tag:"200개국 지원",color:"#EF4444"},
            {name:"하나은행",tag:"시중 은행",color:"#71717A"},
            {name:"신한은행",tag:"시중 은행",color:"#71717A"},
          ].map(s=>(
            <div key={s.name} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:4,height:36,borderRadius:2,background:s.color,flexShrink:0}}/>
              <div>
                <div style={{color:"#E4E4E7",fontWeight:600,fontSize:"clamp(13px,3.5vw,14px)"}}>{s.name}</div>
                <div style={{color:"#71717A",fontSize:"clamp(11px,3vw,12px)",marginTop:2}}>{s.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 데이터 출처 & 투명성 (E-E-A-T) */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"clamp(20px,4vw,32px)",marginBottom:16}}>
        <h2 style={{color:"#60A5FA",fontSize:"clamp(17px,4.2vw,20px)",fontWeight:700,textAlign:"center",marginBottom:20}}>데이터 출처 및 투명성</h2>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            {icon:"📊",title:"환율 데이터",desc:"open.er-api.com의 무료 중간시장 환율 API를 사용합니다. 매일 자동 갱신되며, 특정 금융기관의 환율이 아닌 시장 중간값(mid-market rate)을 기준으로 합니다."},
            {icon:"💰",title:"수수료·스프레드 데이터",desc:"Wise Comparison API(무료, 공개)에서 실시간 수집하며, 한국 서비스(센트비·모인·토스 등)는 각 서비스 공식 웹사이트의 요금표를 기반으로 수동 검증합니다."},
            {icon:"🤖",title:"블로그 콘텐츠",desc:"AI(Groq Llama 3.3)가 실시간 시장 데이터를 기반으로 초안을 작성하며, 모든 수치는 실제 API 데이터에서 인용됩니다. 투기 조언이나 특정 서비스 추천을 하지 않습니다."},
            {icon:"🔄",title:"업데이트 주기",desc:"환율·수수료·블로그 콘텐츠가 매일 오전 9시(KST)에 GitHub Actions를 통해 자동 갱신됩니다. 모든 소스 코드는 GitHub에 공개되어 있습니다."},
          ].map(item=>(
            <div key={item.title} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",background:"rgba(255,255,255,0.02)",borderRadius:10}}>
              <span style={{fontSize:24,flexShrink:0}}>{item.icon}</span>
              <div>
                <p style={{color:"#E4E4E7",fontWeight:600,fontSize:"clamp(13px,3.5vw,15px)",margin:"0 0 4px"}}>{item.title}</p>
                <p style={{color:"#A1A1AA",fontSize:"clamp(12px,3vw,13px)",lineHeight:1.7,margin:0}}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 면책 조항 */}
      <div style={{background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.12)",borderRadius:12,padding:"clamp(16px,3vw,24px)",marginBottom:16}}>
        <h3 style={{color:"#EF4444",fontSize:"clamp(14px,3.5vw,16px)",fontWeight:700,margin:"0 0 10px"}}>⚠️ 면책 조항</h3>
        <ul style={{color:"#A1A1AA",fontSize:"clamp(12px,3vw,13px)",lineHeight:1.8,paddingLeft:18,margin:0}}>
          <li>본 서비스는 정보 제공 목적이며, 특정 송금 서비스를 추천하거나 보증하지 않습니다.</li>
          <li>표시된 환율·수수료는 조회 시점 기준이며, 실제 송금 시 차이가 발생할 수 있습니다.</li>
          <li>투자·금융 의사결정은 반드시 각 서비스의 공식 정보를 확인한 후 진행하세요.</li>
          <li>본 서비스는 어떠한 송금 서비스와도 광고·제휴 관계가 없습니다.</li>
        </ul>
      </div>

      {/* CTA */}
      <div style={{textAlign:"center",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"clamp(28px,5vw,48px)"}}>
        <h2 style={{color:"#E4E4E7",fontSize:"clamp(18px,4.5vw,24px)",fontWeight:800,marginBottom:12}}>지금 바로 비교해보세요!</h2>
        <p style={{color:"#A1A1AA",fontSize:"clamp(14px,3.8vw,16px)",marginBottom:24,lineHeight:1.7}}>
          100만원 송금 기준, 서비스마다 최대 수만 원 차이가 납니다.<br/>
          몇 초만에 가장 저렴한 방법을 찾을 수 있습니다.
        </p>
        <button
          onClick={onBack}
          style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",border:"none",borderRadius:50,padding:"clamp(12px,3vw,16px) clamp(28px,6vw,48px)",fontSize:"clamp(15px,4vw,18px)",fontWeight:700,cursor:"pointer",transition:"all 0.2s",boxShadow:"0 4px 20px rgba(59,130,246,0.3)"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(59,130,246,0.4)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(59,130,246,0.3)";}}
        >
          ⚖️ 수수료 비교 시작하기
        </button>
      </div>
    </div>

    {/* 푸터 */}
    <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",padding:"16px",textAlign:"center"}}>
      <p style={{color:"#3F3F46",fontSize:12,margin:0}}>© 2026 해외송금 수수료 비교. All rights reserved.</p>
      <p style={{margin:"8px 0 0",display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#60A5FA",fontSize:13,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,padding:0}}>홈으로</button>
        <a href="/blog" style={{color:"#52525B",fontSize:13,textDecoration:"underline",textUnderlineOffset:3}}>블로그</a>
        <a href="/privacy" style={{color:"#52525B",fontSize:13,textDecoration:"underline",textUnderlineOffset:3}}>개인정보 보호정책</a>
      </p>
      <p style={{color:"#3F3F46",fontSize:11,margin:"8px 0 0"}}>문의: the@designer-kyungho.com</p>
    </div>
  </div>
);
