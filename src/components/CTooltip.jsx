export const CTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"rgba(8,8,16,0.97)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 12px",backdropFilter:"blur(12px)",maxWidth:"90vw"}}>
      <p style={{color:"#71717A",fontSize:"clamp(14px, 3.5vw, 14px)",margin:0,marginBottom:3}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color||"#fff",fontSize:"clamp(14px, 3.5vw, 14px)",margin:"1px 0",fontWeight:600}}>
          {p.name}: {typeof p.value==="number"?p.value.toLocaleString():p.value}
        </p>
      ))}
    </div>
  );
};
