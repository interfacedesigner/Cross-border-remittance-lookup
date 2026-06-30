export const CTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:8,padding:"8px 12px",boxShadow:"0 2px 12px rgba(0,0,0,0.12)",maxWidth:"90vw"}}>
      <p style={{color:"#757575",fontSize:"clamp(14px, 3.5vw, 14px)",margin:0,marginBottom:3}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color||"#222222",fontSize:"clamp(14px, 3.5vw, 14px)",margin:"1px 0",fontWeight:600}}>
          {p.name}: {typeof p.value==="number"?p.value.toLocaleString():p.value}
        </p>
      ))}
    </div>
  );
};
