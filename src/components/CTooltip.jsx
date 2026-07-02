import { useTheme } from "../utils/useTheme";
import { fontWeight as fw, radius } from "../styles/theme";

export const CTooltip = ({active,payload,label}) => {
  const { c } = useTheme();
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:c.bgPrimary,border:`1px solid ${c.border}`,borderRadius:radius.lg,padding:"8px 12px",boxShadow:`0 2px 12px ${c.shadow}`,maxWidth:"90vw"}}>
      <p style={{color:c.textDim,fontSize:"clamp(14px, 3.5vw, 14px)",margin:0,marginBottom:3}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color||c.text,fontSize:"clamp(14px, 3.5vw, 14px)",margin:"1px 0",fontWeight:fw.semibold}}>
          {p.name}: {typeof p.value==="number"?p.value.toLocaleString():p.value}
        </p>
      ))}
    </div>
  );
};
