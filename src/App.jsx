import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, ReferenceLine, Legend, ComposedChart } from "recharts";

// ═══════════════════════════════════════════════════
// GOOGLE ANALYTICS HELPER
// ═══════════════════════════════════════════════════
const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// ═══════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════
const CURRENCIES = {
  USD:{code:"USD",name:"미국 달러",flag:"🇺🇸",symbol:"$",color:"#22C55E",base:1474},
  JPY:{code:"JPY",name:"일본 엔(100)",flag:"🇯🇵",symbol:"¥",color:"#EF4444",unit:100,base:938},
  EUR:{code:"EUR",name:"유로",flag:"🇪🇺",symbol:"€",color:"#3B82F6",base:1545},
  GBP:{code:"GBP",name:"영국 파운드",flag:"🇬🇧",symbol:"£",color:"#F59E0B",base:1885},
  CNY:{code:"CNY",name:"중국 위안",flag:"🇨🇳",symbol:"¥",color:"#F97316",base:201},
  AUD:{code:"AUD",name:"호주 달러",flag:"🇦🇺",symbol:"A$",color:"#06B6D4",base:952},
  CAD:{code:"CAD",name:"캐나다 달러",flag:"🇨🇦",symbol:"C$",color:"#DC2626",base:1025},
  SGD:{code:"SGD",name:"싱가포르 달러",flag:"🇸🇬",symbol:"S$",color:"#8B5CF6",base:1132},
};

// Historical monthly data (2020-2026)
const HIST={USD:[{d:"2020-01",r:1165},{d:"2020-02",r:1191},{d:"2020-03",r:1226},{d:"2020-04",r:1222},{d:"2020-05",r:1238},{d:"2020-06",r:1199},{d:"2020-07",r:1196},{d:"2020-08",r:1187},{d:"2020-09",r:1169},{d:"2020-10",r:1135},{d:"2020-11",r:1113},{d:"2020-12",r:1088},{d:"2021-01",r:1100},{d:"2021-02",r:1107},{d:"2021-03",r:1131},{d:"2021-04",r:1118},{d:"2021-05",r:1116},{d:"2021-06",r:1130},{d:"2021-07",r:1150},{d:"2021-08",r:1165},{d:"2021-09",r:1180},{d:"2021-10",r:1175},{d:"2021-11",r:1187},{d:"2021-12",r:1189},{d:"2022-01",r:1198},{d:"2022-02",r:1197},{d:"2022-03",r:1215},{d:"2022-04",r:1252},{d:"2022-05",r:1265},{d:"2022-06",r:1295},{d:"2022-07",r:1306},{d:"2022-08",r:1325},{d:"2022-09",r:1397},{d:"2022-10",r:1424},{d:"2022-11",r:1330},{d:"2022-12",r:1272},{d:"2023-01",r:1248},{d:"2023-02",r:1282},{d:"2023-03",r:1305},{d:"2023-04",r:1325},{d:"2023-05",r:1329},{d:"2023-06",r:1285},{d:"2023-07",r:1282},{d:"2023-08",r:1322},{d:"2023-09",r:1338},{d:"2023-10",r:1347},{d:"2023-11",r:1306},{d:"2023-12",r:1289},{d:"2024-01",r:1328},{d:"2024-02",r:1333},{d:"2024-03",r:1341},{d:"2024-04",r:1373},{d:"2024-05",r:1365},{d:"2024-06",r:1382},{d:"2024-07",r:1374},{d:"2024-08",r:1352},{d:"2024-09",r:1330},{d:"2024-10",r:1361},{d:"2024-11",r:1399},{d:"2024-12",r:1453},{d:"2025-01",r:1460},{d:"2025-02",r:1448},{d:"2025-03",r:1450},{d:"2025-04",r:1487},{d:"2025-05",r:1425},{d:"2025-06",r:1402},{d:"2025-07",r:1389},{d:"2025-08",r:1400},{d:"2025-09",r:1379},{d:"2025-10",r:1395},{d:"2025-11",r:1420},{d:"2025-12",r:1480},{d:"2026-01",r:1465},{d:"2026-02",r:1474}],JPY:[{d:"2020-01",r:1072},{d:"2020-02",r:1086},{d:"2020-03",r:1126},{d:"2020-04",r:1131},{d:"2020-05",r:1152},{d:"2020-06",r:1118},{d:"2020-07",r:1113},{d:"2020-08",r:1115},{d:"2020-09",r:1105},{d:"2020-10",r:1074},{d:"2020-11",r:1068},{d:"2020-12",r:1053},{d:"2021-01",r:1063},{d:"2021-02",r:1050},{d:"2021-03",r:1032},{d:"2021-04",r:1029},{d:"2021-05",r:1023},{d:"2021-06",r:1025},{d:"2021-07",r:1044},{d:"2021-08",r:1060},{d:"2021-09",r:1073},{d:"2021-10",r:1033},{d:"2021-11",r:1042},{d:"2021-12",r:1033},{d:"2022-01",r:1041},{d:"2022-02",r:1038},{d:"2022-03",r:997},{d:"2022-04",r:967},{d:"2022-05",r:984},{d:"2022-06",r:957},{d:"2022-07",r:955},{d:"2022-08",r:968},{d:"2022-09",r:964},{d:"2022-10",r:960},{d:"2022-11",r:960},{d:"2022-12",r:946},{d:"2023-01",r:960},{d:"2023-02",r:955},{d:"2023-03",r:980},{d:"2023-04",r:993},{d:"2023-05",r:964},{d:"2023-06",r:910},{d:"2023-07",r:914},{d:"2023-08",r:912},{d:"2023-09",r:899},{d:"2023-10",r:902},{d:"2023-11",r:876},{d:"2023-12",r:905},{d:"2024-01",r:904},{d:"2024-02",r:889},{d:"2024-03",r:889},{d:"2024-04",r:882},{d:"2024-05",r:869},{d:"2024-06",r:863},{d:"2024-07",r:878},{d:"2024-08",r:925},{d:"2024-09",r:924},{d:"2024-10",r:897},{d:"2024-11",r:910},{d:"2024-12",r:926},{d:"2025-01",r:938},{d:"2025-02",r:952},{d:"2025-03",r:968},{d:"2025-04",r:1025},{d:"2025-05",r:989},{d:"2025-06",r:970},{d:"2025-07",r:960},{d:"2025-08",r:972},{d:"2025-09",r:963},{d:"2025-10",r:945},{d:"2025-11",r:935},{d:"2025-12",r:956},{d:"2026-01",r:942},{d:"2026-02",r:938}],EUR:[{d:"2020-01",r:1288},{d:"2020-02",r:1303},{d:"2020-03",r:1348},{d:"2020-04",r:1337},{d:"2020-05",r:1346},{d:"2020-06",r:1348},{d:"2020-07",r:1380},{d:"2020-08",r:1411},{d:"2020-09",r:1383},{d:"2020-10",r:1339},{d:"2020-11",r:1333},{d:"2020-12",r:1335},{d:"2021-01",r:1332},{d:"2021-02",r:1339},{d:"2021-03",r:1337},{d:"2021-04",r:1346},{d:"2021-05",r:1362},{d:"2021-06",r:1345},{d:"2021-07",r:1357},{d:"2021-08",r:1372},{d:"2021-09",r:1377},{d:"2021-10",r:1363},{d:"2021-11",r:1341},{d:"2021-12",r:1345},{d:"2022-01",r:1353},{d:"2022-02",r:1350},{d:"2022-03",r:1339},{d:"2022-04",r:1349},{d:"2022-05",r:1337},{d:"2022-06",r:1353},{d:"2022-07",r:1331},{d:"2022-08",r:1325},{d:"2022-09",r:1390},{d:"2022-10",r:1400},{d:"2022-11",r:1370},{d:"2022-12",r:1350},{d:"2023-01",r:1352},{d:"2023-02",r:1368},{d:"2023-03",r:1414},{d:"2023-04",r:1453},{d:"2023-05",r:1435},{d:"2023-06",r:1402},{d:"2023-07",r:1425},{d:"2023-08",r:1439},{d:"2023-09",r:1415},{d:"2023-10",r:1411},{d:"2023-11",r:1425},{d:"2023-12",r:1422},{d:"2024-01",r:1445},{d:"2024-02",r:1441},{d:"2024-03",r:1453},{d:"2024-04",r:1462},{d:"2024-05",r:1477},{d:"2024-06",r:1480},{d:"2024-07",r:1489},{d:"2024-08",r:1498},{d:"2024-09",r:1483},{d:"2024-10",r:1471},{d:"2024-11",r:1474},{d:"2024-12",r:1516},{d:"2025-01",r:1510},{d:"2025-02",r:1520},{d:"2025-03",r:1565},{d:"2025-04",r:1685},{d:"2025-05",r:1600},{d:"2025-06",r:1582},{d:"2025-07",r:1570},{d:"2025-08",r:1568},{d:"2025-09",r:1538},{d:"2025-10",r:1555},{d:"2025-11",r:1497},{d:"2025-12",r:1540},{d:"2026-01",r:1535},{d:"2026-02",r:1545}],GBP:[{d:"2020-01",r:1514},{d:"2020-02",r:1531},{d:"2020-03",r:1506},{d:"2020-04",r:1509},{d:"2020-05",r:1518},{d:"2020-06",r:1489},{d:"2020-07",r:1517},{d:"2020-08",r:1562},{d:"2020-09",r:1511},{d:"2020-10",r:1474},{d:"2020-11",r:1486},{d:"2020-12",r:1483},{d:"2021-01",r:1504},{d:"2021-02",r:1539},{d:"2021-03",r:1557},{d:"2021-04",r:1548},{d:"2021-05",r:1578},{d:"2021-06",r:1569},{d:"2021-07",r:1597},{d:"2021-08",r:1609},{d:"2021-09",r:1608},{d:"2021-10",r:1607},{d:"2021-11",r:1583},{d:"2021-12",r:1598},{d:"2022-01",r:1618},{d:"2022-02",r:1615},{d:"2022-03",r:1595},{d:"2022-04",r:1605},{d:"2022-05",r:1575},{d:"2022-06",r:1586},{d:"2022-07",r:1572},{d:"2022-08",r:1567},{d:"2022-09",r:1533},{d:"2022-10",r:1580},{d:"2022-11",r:1596},{d:"2022-12",r:1545},{d:"2023-01",r:1547},{d:"2023-02",r:1558},{d:"2023-03",r:1613},{d:"2023-04",r:1660},{d:"2023-05",r:1656},{d:"2023-06",r:1636},{d:"2023-07",r:1700},{d:"2023-08",r:1682},{d:"2023-09",r:1640},{d:"2023-10",r:1636},{d:"2023-11",r:1649},{d:"2023-12",r:1643},{d:"2024-01",r:1691},{d:"2024-02",r:1688},{d:"2024-03",r:1699},{d:"2024-04",r:1710},{d:"2024-05",r:1726},{d:"2024-06",r:1745},{d:"2024-07",r:1772},{d:"2024-08",r:1766},{d:"2024-09",r:1765},{d:"2024-10",r:1754},{d:"2024-11",r:1771},{d:"2024-12",r:1835},{d:"2025-01",r:1810},{d:"2025-02",r:1825},{d:"2025-03",r:1882},{d:"2025-04",r:1974},{d:"2025-05",r:1896},{d:"2025-06",r:1870},{d:"2025-07",r:1855},{d:"2025-08",r:1860},{d:"2025-09",r:1830},{d:"2025-10",r:1845},{d:"2025-11",r:1810},{d:"2025-12",r:1880},{d:"2026-01",r:1870},{d:"2026-02",r:1885}],CNY:[{d:"2020-01",r:168},{d:"2020-02",r:170},{d:"2020-03",r:174},{d:"2020-04",r:173},{d:"2020-05",r:174},{d:"2020-06",r:169},{d:"2020-07",r:171},{d:"2020-08",r:172},{d:"2020-09",r:172},{d:"2020-10",r:169},{d:"2020-11",r:169},{d:"2020-12",r:167},{d:"2021-01",r:170},{d:"2021-02",r:171},{d:"2021-03",r:173},{d:"2021-04",r:172},{d:"2021-05",r:173},{d:"2021-06",r:175},{d:"2021-07",r:178},{d:"2021-08",r:180},{d:"2021-09",r:183},{d:"2021-10",r:184},{d:"2021-11",r:186},{d:"2021-12",r:187},{d:"2022-01",r:189},{d:"2022-02",r:189},{d:"2022-03",r:191},{d:"2022-04",r:192},{d:"2022-05",r:189},{d:"2022-06",r:193},{d:"2022-07",r:194},{d:"2022-08",r:194},{d:"2022-09",r:197},{d:"2022-10",r:196},{d:"2022-11",r:186},{d:"2022-12",r:183},{d:"2023-01",r:184},{d:"2023-02",r:186},{d:"2023-03",r:190},{d:"2023-04",r:192},{d:"2023-05",r:186},{d:"2023-06",r:178},{d:"2023-07",r:178},{d:"2023-08",r:181},{d:"2023-09",r:183},{d:"2023-10",r:184},{d:"2023-11",r:183},{d:"2023-12",r:182},{d:"2024-01",r:186},{d:"2024-02",r:185},{d:"2024-03",r:186},{d:"2024-04",r:189},{d:"2024-05",r:188},{d:"2024-06",r:190},{d:"2024-07",r:189},{d:"2024-08",r:190},{d:"2024-09",r:188},{d:"2024-10",r:191},{d:"2024-11",r:193},{d:"2024-12",r:199},{d:"2025-01",r:200},{d:"2025-02",r:202},{d:"2025-03",r:200},{d:"2025-04",r:204},{d:"2025-05",r:197},{d:"2025-06",r:194},{d:"2025-07",r:192},{d:"2025-08",r:194},{d:"2025-09",r:195},{d:"2025-10",r:196},{d:"2025-11",r:197},{d:"2025-12",r:203},{d:"2026-01",r:200},{d:"2026-02",r:201}],AUD:[{d:"2020-01",r:798},{d:"2020-02",r:789},{d:"2020-03",r:748},{d:"2020-04",r:768},{d:"2020-05",r:815},{d:"2020-06",r:827},{d:"2020-07",r:846},{d:"2020-08",r:857},{d:"2020-09",r:834},{d:"2020-10",r:810},{d:"2020-11",r:818},{d:"2020-12",r:835},{d:"2021-01",r:851},{d:"2021-02",r:864},{d:"2021-03",r:863},{d:"2021-04",r:862},{d:"2021-05",r:862},{d:"2021-06",r:852},{d:"2021-07",r:853},{d:"2021-08",r:853},{d:"2021-09",r:852},{d:"2021-10",r:878},{d:"2021-11",r:854},{d:"2021-12",r:857},{d:"2022-01",r:857},{d:"2022-02",r:857},{d:"2022-03",r:897},{d:"2022-04",r:920},{d:"2022-05",r:884},{d:"2022-06",r:893},{d:"2022-07",r:896},{d:"2022-08",r:914},{d:"2022-09",r:912},{d:"2022-10",r:896},{d:"2022-11",r:901},{d:"2022-12",r:861},{d:"2023-01",r:872},{d:"2023-02",r:875},{d:"2023-03",r:875},{d:"2023-04",r:892},{d:"2023-05",r:876},{d:"2023-06",r:858},{d:"2023-07",r:870},{d:"2023-08",r:852},{d:"2023-09",r:860},{d:"2023-10",r:856},{d:"2023-11",r:860},{d:"2023-12",r:878},{d:"2024-01",r:877},{d:"2024-02",r:872},{d:"2024-03",r:877},{d:"2024-04",r:884},{d:"2024-05",r:896},{d:"2024-06",r:912},{d:"2024-07",r:915},{d:"2024-08",r:903},{d:"2024-09",r:912},{d:"2024-10",r:902},{d:"2024-11",r:910},{d:"2024-12",r:922},{d:"2025-01",r:915},{d:"2025-02",r:920},{d:"2025-03",r:925},{d:"2025-04",r:945},{d:"2025-05",r:935},{d:"2025-06",r:920},{d:"2025-07",r:910},{d:"2025-08",r:915},{d:"2025-09",r:925},{d:"2025-10",r:930},{d:"2025-11",r:920},{d:"2025-12",r:955},{d:"2026-01",r:948},{d:"2026-02",r:952}],CAD:[{d:"2020-01",r:890},{d:"2020-02",r:893},{d:"2020-03",r:870},{d:"2020-04",r:864},{d:"2020-05",r:891},{d:"2020-06",r:886},{d:"2020-07",r:890},{d:"2020-08",r:895},{d:"2020-09",r:882},{d:"2020-10",r:862},{d:"2020-11",r:863},{d:"2020-12",r:854},{d:"2021-01",r:862},{d:"2021-02",r:878},{d:"2021-03",r:897},{d:"2021-04",r:897},{d:"2021-05",r:918},{d:"2021-06",r:918},{d:"2021-07",r:921},{d:"2021-08",r:926},{d:"2021-09",r:932},{d:"2021-10",r:948},{d:"2021-11",r:937},{d:"2021-12",r:932},{d:"2022-01",r:939},{d:"2022-02",r:943},{d:"2022-03",r:961},{d:"2022-04",r:980},{d:"2022-05",r:982},{d:"2022-06",r:1002},{d:"2022-07",r:1005},{d:"2022-08",r:1022},{d:"2022-09",r:1023},{d:"2022-10",r:1035},{d:"2022-11",r:988},{d:"2022-12",r:940},{d:"2023-01",r:932},{d:"2023-02",r:953},{d:"2023-03",r:965},{d:"2023-04",r:988},{d:"2023-05",r:990},{d:"2023-06",r:974},{d:"2023-07",r:976},{d:"2023-08",r:976},{d:"2023-09",r:984},{d:"2023-10",r:978},{d:"2023-11",r:963},{d:"2023-12",r:976},{d:"2024-01",r:993},{d:"2024-02",r:987},{d:"2024-03",r:992},{d:"2024-04",r:1003},{d:"2024-05",r:1000},{d:"2024-06",r:1009},{d:"2024-07",r:1004},{d:"2024-08",r:989},{d:"2024-09",r:981},{d:"2024-10",r:980},{d:"2024-11",r:998},{d:"2024-12",r:1012},{d:"2025-01",r:1015},{d:"2025-02",r:1020},{d:"2025-03",r:1008},{d:"2025-04",r:1058},{d:"2025-05",r:1035},{d:"2025-06",r:1028},{d:"2025-07",r:1020},{d:"2025-08",r:1022},{d:"2025-09",r:1010},{d:"2025-10",r:1005},{d:"2025-11",r:998},{d:"2025-12",r:1028},{d:"2026-01",r:1022},{d:"2026-02",r:1025}],SGD:[{d:"2020-01",r:861},{d:"2020-02",r:859},{d:"2020-03",r:861},{d:"2020-04",r:860},{d:"2020-05",r:876},{d:"2020-06",r:861},{d:"2020-07",r:863},{d:"2020-08",r:864},{d:"2020-09",r:855},{d:"2020-10",r:836},{d:"2020-11",r:835},{d:"2020-12",r:822},{d:"2021-01",r:830},{d:"2021-02",r:833},{d:"2021-03",r:842},{d:"2021-04",r:841},{d:"2021-05",r:841},{d:"2021-06",r:845},{d:"2021-07",r:850},{d:"2021-08",r:862},{d:"2021-09",r:873},{d:"2021-10",r:869},{d:"2021-11",r:872},{d:"2021-12",r:876},{d:"2022-01",r:885},{d:"2022-02",r:884},{d:"2022-03",r:893},{d:"2022-04",r:907},{d:"2022-05",r:912},{d:"2022-06",r:932},{d:"2022-07",r:940},{d:"2022-08",r:951},{d:"2022-09",r:979},{d:"2022-10",r:997},{d:"2022-11",r:975},{d:"2022-12",r:948},{d:"2023-01",r:943},{d:"2023-02",r:961},{d:"2023-03",r:978},{d:"2023-04",r:998},{d:"2023-05",r:990},{d:"2023-06",r:963},{d:"2023-07",r:967},{d:"2023-08",r:978},{d:"2023-09",r:986},{d:"2023-10",r:977},{d:"2023-11",r:976},{d:"2023-12",r:978},{d:"2024-01",r:996},{d:"2024-02",r:993},{d:"2024-03",r:1000},{d:"2024-04",r:1012},{d:"2024-05",r:1011},{d:"2024-06",r:1024},{d:"2024-07",r:1029},{d:"2024-08",r:1032},{d:"2024-09",r:1029},{d:"2024-10",r:1030},{d:"2024-11",r:1048},{d:"2024-12",r:1072},{d:"2025-01",r:1080},{d:"2025-02",r:1088},{d:"2025-03",r:1095},{d:"2025-04",r:1145},{d:"2025-05",r:1110},{d:"2025-06",r:1098},{d:"2025-07",r:1088},{d:"2025-08",r:1092},{d:"2025-09",r:1078},{d:"2025-10",r:1085},{d:"2025-11",r:1095},{d:"2025-12",r:1135},{d:"2026-01",r:1128},{d:"2026-02",r:1132}]};

// ═══════════════════════════════════════════════════
// SERVICE AVAILABILITY (주말/공휴일 가용 여부)
// ═══════════════════════════════════════════════════
const SVC_AVAIL = {
  wise:      { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  sentbe:    { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  moin:      { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  wirebarley:{ weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  toss:      { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  paypal:    { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  hana:      { weekend: false, holiday: false, label: "영업일만 가능",   processNote: "09:00~16:00" },
  shinhan:   { weekend: false, holiday: false, label: "영업일만 가능",   processNote: "09:00~16:00" },
};

// ═══════════════════════════════════════════════════
// SERVICE DEFINITIONS — loaded from fee-data.json
// (updated weekly via GitHub Actions + Claude API)
// Fallback hardcoded values used if JSON unavailable
// ═══════════════════════════════════════════════════
const CTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"rgba(8,8,16,0.97)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 12px",backdropFilter:"blur(12px)",maxWidth:"90vw"}}>
      <p style={{color:"#71717A",fontSize:"clamp(11px, 2.8vw, 12px)",margin:0,marginBottom:3}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color||"#fff",fontSize:"clamp(12px, 3vw, 13px)",margin:"1px 0",fontWeight:600}}>
          {p.name}: {typeof p.value==="number"?p.value.toLocaleString():p.value}
        </p>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// AMOUNT INPUT (완전 uncontrolled — 커서 문제 원천 차단)
// React의 value 바인딩을 사용하지 않음
// ═══════════════════════════════════════════════════
const AmountInput = ({ amount, setAmount }) => {
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // 외부에서 amount가 변경되면 (퀵버튼 등) 입력 필드도 업데이트
  useEffect(() => {
    if (!inputRef.current) return;
    // 현재 포커스가 이 입력 필드에 있으면 업데이트 안 함 (타이핑 중)
    if (document.activeElement === inputRef.current) return;
    inputRef.current.value = amount > 0 ? amount.toLocaleString() : "";
  }, [amount]);

  const parseAndSet = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    const v = parseInt(digits, 10);
    if (!isNaN(v) && v > 0 && v <= 999999999) {
      setAmount(v);
    } else {
      setAmount(0);
    }
  };

  const handleInput = (e) => {
    // 숫자 외 문자 즉시 제거
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits.length > 9) {
      e.target.value = digits.slice(0, 9);
    } else if (raw !== digits) {
      e.target.value = digits;
    }
    // 500ms debounce로 amount 업데이트 (리렌더링 최소화)
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => parseAndSet(e.target.value), 500);
  };

  const handleBlur = (e) => {
    clearTimeout(timerRef.current);
    parseAndSet(e.target.value);
    // blur 시 포맷 표시
    const digits = e.target.value.replace(/[^0-9]/g, "");
    const v = parseInt(digits, 10);
    if (!isNaN(v) && v > 0) {
      e.target.value = v.toLocaleString();
    } else {
      e.target.value = "";
    }
    e.target.style.borderColor = "rgba(255,255,255,0.08)";
    e.target.style.boxShadow = "none";
  };

  const handleFocus = (e) => {
    // 포커스 시 순수 숫자로 전환
    const digits = e.target.value.replace(/[^0-9]/g, "");
    e.target.value = digits === "0" ? "" : digits;
    e.target.style.borderColor = "rgba(59,130,246,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
    // 전체 선택 (편리한 수정)
    setTimeout(() => e.target.select(), 0);
  };

  const handleKeyDown = (e) => {
    // Enter 키로 즉시 반영
    if (e.key === "Enter") {
      clearTimeout(timerRef.current);
      parseAndSet(e.target.value);
      e.target.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      defaultValue={amount > 0 ? amount.toLocaleString() : ""}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="송금할 금액을 입력하세요"
      autoComplete="off"
      style={{
        width:"100%", boxSizing:"border-box",
        padding:"14px 16px", borderRadius:12,
        border:"1.5px solid rgba(255,255,255,0.08)",
        background:"rgba(255,255,255,0.04)",
        color:"#E4E4E7",
        fontSize:"clamp(20px, 6vw, 28px)", fontWeight:700,
        fontFamily:"'JetBrains Mono', 'SF Mono', monospace",
        textAlign:"right", outline:"none",
        transition:"border-color 0.2s, box-shadow 0.2s",
        WebkitAppearance:"none",
        minHeight:"clamp(54px, 12vw, 60px)",
        letterSpacing:"0.5px",
      }}
    />
  );
};

// ═══════════════════════════════════════════════════
// ADSENSE COMPONENT
// ═══════════════════════════════════════════════════
const AdSenseAd = ({ slot, format = "auto", responsive = true, style = {} }) => {
  const adRef = useRef(null);

  useEffect(() => {
    if (adRef.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  return (
    <div style={{
      margin: "16px 0",
      padding: "12px",
      background: "rgba(255,255,255,0.02)",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.04)",
      minHeight: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      ...style
    }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client="ca-pub-1792554171041608"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════
// BUSINESS DAY CHECK (KST, Korean holidays)
// ═══════════════════════════════════════════════════
const getKST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 3600000); // KST = UTC+9
};

// Korean public holidays (fixed + lunar-based approximations for 2025-2026)
const KOREAN_HOLIDAYS = [
  // 2025
  "2025-01-01","2025-01-28","2025-01-29","2025-01-30", // 신정, 설날연휴
  "2025-03-01","2025-05-01","2025-05-05","2025-05-06", // 삼일절, 근로자의날, 어린이날, 대체공휴일
  "2025-06-06","2025-08-15",                            // 현충일, 광복절
  "2025-10-03","2025-10-05","2025-10-06","2025-10-07", // 개천절, 추석연휴
  "2025-10-09","2025-12-25",                            // 한글날, 성탄절
  // 2026
  "2026-01-01","2026-02-16","2026-02-17","2026-02-18", // 신정, 설날연휴
  "2026-03-01","2026-05-01","2026-05-05","2026-05-24", // 삼일절, 근로자의날, 어린이날, 석가탄신일
  "2026-06-06","2026-08-15",                            // 현충일, 광복절
  "2026-09-24","2026-09-25","2026-09-26",              // 추석연휴
  "2026-10-03","2026-10-09","2026-12-25",              // 개천절, 한글날, 성탄절
];

const isBusinessDay = () => {
  const kst = getKST();
  const day = kst.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const dateStr = `${kst.getFullYear()}-${String(kst.getMonth()+1).padStart(2,'0')}-${String(kst.getDate()).padStart(2,'0')}`;
  if (KOREAN_HOLIDAYS.includes(dateStr)) return false;
  return true;
};

const getNextBusinessDay = () => {
  const kst = getKST();
  let next = new Date(kst);
  for (let i = 0; i < 10; i++) {
    next.setDate(next.getDate() + 1);
    const d = next.getDay();
    const ds = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
    if (d !== 0 && d !== 6 && !KOREAN_HOLIDAYS.includes(ds)) {
      return `${next.getMonth()+1}월 ${next.getDate()}일 (${['일','월','화','수','목','금','토'][d]})`;
    }
  }
  return "다음 영업일";
};

const getNonBusinessReason = () => {
  const kst = getKST();
  const day = kst.getDay();
  const dateStr = `${kst.getFullYear()}-${String(kst.getMonth()+1).padStart(2,'0')}-${String(kst.getDate()).padStart(2,'0')}`;
  if (KOREAN_HOLIDAYS.includes(dateStr)) return "공휴일";
  if (day === 0) return "일요일";
  if (day === 6) return "토요일";
  return "";
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("compare");
  const [cur, setCur] = useState("USD");
  const [amount, setAmount] = useState(1000000); // 원화 기준 (100만원)
  const [direction, setDirection] = useState("outbound");
  const [selectedYear, setSelectedYear] = useState("all");
  const [multiCur, setMultiCur] = useState(["USD","JPY","EUR"]);

  // Live state
  const [midRate, setMidRate] = useState(null);
  const [svcSnapshot, setSvcSnapshot] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [bizDayBlocked, setBizDayBlocked] = useState(false);

  // Fee data from fee-data.json (updated Mon/Wed/Fri via Claude API + Web Search)
  const [feeData, setFeeData] = useState(null);
  const [feeDataMeta, setFeeDataMeta] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  const ci = CURRENCIES[cur];
  const hist = HIST[cur] || [];
  const curRate = midRate || ci.base;
  const avg = hist.length ? Math.round(hist.reduce((a,b)=>a+b.r,0)/hist.length) : 0;
  const mn = hist.length ? Math.min(...hist.map(d=>d.r)) : 0;
  const mx = hist.length ? Math.max(...hist.map(d=>d.r)) : 0;
  const pct = mx!==mn ? Math.round(((curRate-mn)/(mx-mn))*100) : 50;

  // ═══════════════════════════════════════════════════
  // LOAD FEE DATA (fixed snapshots from GitHub Actions)
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    const loadFeeData = async () => {
      setDataLoading(true);
      try {
        const resp = await fetch("/fee-data.json?" + Date.now());
        if (resp.ok) {
          const data = await resp.json();
          setFeeData(data);
          setFeeDataMeta({
            updatedAt: data.updatedAt,
            source: data.source,
            schedule: data.schedule,
            stats: data.stats,
          });
        } else {
          throw new Error("HTTP " + resp.status);
        }
      } catch (err) {
        console.warn("fee-data.json load failed:", err.message);
        setFeeData(null);
        setFeeDataMeta({ updatedAt: "error", source: "none" });
      }
      setDataLoading(false);
    };
    loadFeeData();
  }, []);

  // ═══════════════════════════════════════════════════
  // REAL-TIME EXCHANGE RATE (클라이언트에서 직접 호출)
  // open.er-api.com: 무료, API키 불필요, 1일 1회 갱신
  // ═══════════════════════════════════════════════════
  const [liveRates, setLiveRates] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateFetchedAt, setRateFetchedAt] = useState(null);
  const rateCacheRef = useRef(null); // 5분 캐시

  const fetchLiveRates = useCallback(async () => {
    // 5분 캐시 — 불필요한 반복 호출 방지
    if (rateCacheRef.current && (Date.now() - rateCacheRef.current.time < 5 * 60 * 1000)) {
      setLiveRates(rateCacheRef.current.rates);
      setRateFetchedAt(new Date(rateCacheRef.current.time));
      return rateCacheRef.current.rates;
    }

    setRateLoading(true);
    try {
      const resp = await fetch("https://open.er-api.com/v6/latest/KRW");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (data.result !== "success") throw new Error(data["error-type"] || "Unknown error");

      const rates = {};
      for (const [code, info] of Object.entries(CURRENCIES)) {
        const rawRate = data.rates[code];
        if (!rawRate) continue;
        const unit = info.unit || 1;
        rates[code] = Math.round((1 / rawRate) * unit);
      }

      rateCacheRef.current = { rates, time: Date.now() };
      setLiveRates(rates);
      setRateFetchedAt(new Date());
      setRateLoading(false);
      return rates;
    } catch (err) {
      console.warn("Live rate fetch failed:", err.message);
      setRateLoading(false);
      // Fallback to fee-data.json rates
      if (feeData?.rates?.[cur]) {
        return { [cur]: feeData.rates[cur].midRate };
      }
      return null;
    }
  }, [cur, feeData]);

  // ═══════════════════════════════════════════════════
  // COMPARE: 실시간 환율 + 고정 수수료/스프레드
  // ═══════════════════════════════════════════════════
  const [fetchMode, setFetchMode] = useState("idle");

  const refreshData = useCallback(async () => {
    setFetchMode("loading");
    setBizDayBlocked(!isBusinessDay()); // 차단이 아닌 상태 표시용

    // 1. 수수료 데이터 (fee-data.json)에서 서비스 정보 확인
    const curData = feeData?.rates?.[cur];
    if (!curData?.services) {
      setFetchMode("error");
      return;
    }

    // 2. 실시간 환율 시도 → 실패 시 fee-data.json 환율 사용
    let liveMid = null;
    let rateSource = "fallback";
    try {
      const rates = await fetchLiveRates();
      if (rates?.[cur]) {
        liveMid = rates[cur];
        rateSource = "live";
      }
    } catch {}

    // Fallback: fee-data.json의 midRate 사용
    if (!liveMid) {
      liveMid = curData.midRate;
      rateSource = "cached";
    }

    if (!liveMid) {
      setFetchMode("error");
      return;
    }

    setMidRate(liveMid);

    // 3. 실시간(또는 캐시) 환율 + 금액 구간별 수수료/스프레드로 appliedRate 재계산
    const services = curData.services
      .filter(s => s.supported)
      .map(svc => {
        // 금액 구간별 수수료/스프레드 찾기
        let fee = 0;
        let spread = 0;

        if (svc.feeStructure && Array.isArray(svc.feeStructure)) {
          // 새로운 구간별 구조
          const bracket = svc.feeStructure.find(b => amount >= b.min && amount < b.max);
          if (bracket) {
            fee = bracket.fee;
            spread = bracket.spread;
          }
        } else {
          // 기존 고정 수수료 구조 (하위 호환)
          fee = svc.fee || 0;
          spread = svc.spread || 0;
        }

        // 환율에 스프레드 적용 → 적용환율
        const appliedRate = Math.round(liveMid * (1 + spread / 100));
        const netKRW = amount - fee;
        const foreignAmount = netKRW > 0 ? +(netKRW / appliedRate).toFixed(2) : 0;
        const spreadCost = Math.round(amount * spread / 100);
        const totalCost = fee + spreadCost;

        return {
          id: svc.id,
          name: svc.name,
          kr: svc.kr,
          fee,
          spread,
          appliedRate,
          totalCost,
          foreignAmount,
          speed: svc.speed,
          promotions: svc.promotions || "",
          note: svc.note || "",
          avail: SVC_AVAIL[svc.id] || { weekend: false, holiday: false, label: "확인필요", processNote: "" },
        };
      });

    services.sort((a, b) => a.totalCost - b.totalCost);
    setSvcSnapshot(services);
    setLastUpdate(new Date());
    setFetchMode(rateSource === "live" ? "live" : "cached");
  }, [cur, amount, feeData, fetchLiveRates]);

  const handleRefresh = () => {
    if (amount <= 0) return;

    // GA4 이벤트: 실시간 비교 버튼 클릭
    trackEvent('compare_rates', {
      currency: cur,
      amount: amount,
      amount_category: amount < 1000000 ? 'under_1M' : amount < 5000000 ? '1M_5M' : amount < 10000000 ? '5M_10M' : 'over_10M'
    });

    refreshData();
  };

  // 통화 또는 금액 변경 시 비교 상태 초기화
  useEffect(() => {
    setFetchMode("idle");
    setSvcSnapshot([]);
    setMidRate(null);
    setLastUpdate(null);
  }, [cur, amount]);

  const getSignal = (r, a) => {
    if(direction==="outbound") {
      if(r<=a*0.95) return {s:"적극 매수",c:"#22C55E",i:"🟢"};
      if(r<=a) return {s:"매수 적기",c:"#3B82F6",i:"🔵"};
      if(r<=a*1.05) return {s:"관망",c:"#EAB308",i:"🟡"};
      return {s:"대기 권장",c:"#EF4444",i:"🔴"};
    }
    if(r>=a*1.05) return {s:"적극 수취",c:"#22C55E",i:"🟢"};
    if(r>=a) return {s:"수취 적기",c:"#3B82F6",i:"🔵"};
    return {s:"대기 권장",c:"#EF4444",i:"🔴"};
  };
  const sig = getSignal(curRate, avg);

  const seasonalData = useMemo(() => {
    const months = Array.from({length:12},(_,i)=>({m:i+1,label:`${i+1}월`,rates:[]}));
    hist.forEach(d=>{months[parseInt(d.d.split("-")[1])-1].rates.push(d.r);});
    return months.map(m=>({...m,avg:m.rates.length?Math.round(m.rates.reduce((a,b)=>a+b,0)/m.rates.length):0,min:m.rates.length?Math.min(...m.rates):0,max:m.rates.length?Math.max(...m.rates):0}));
  }, [hist]);

  const filteredHist = selectedYear==="all" ? hist : hist.filter(d=>d.d.startsWith(selectedYear));

  const tabs = [
    {id:"compare",label:"실시간 공정비교",icon:"⚖️"},
    {id:"rate",label:"환율 분석",icon:"📈"},
    {id:"timing",label:"적정시기",icon:"⏰"},
    {id:"multi",label:"다중 통화",icon:"🌍"},
  ];

  // ═══════════════════════════════════════════════════
  // CURRENCY AUTOCOMPLETE SELECT
  // ═══════════════════════════════════════════════════
  const [curSearch, setCurSearch] = useState("");
  const [curOpen, setCurOpen] = useState(false);
  const curRef = useRef(null);
  const curInputRef = useRef(null);

  const curOptions = useMemo(() => {
    const q = curSearch.toLowerCase().trim();
    if (!q) return Object.entries(CURRENCIES);
    return Object.entries(CURRENCIES).filter(([code, info]) =>
      code.toLowerCase().includes(q) ||
      info.name.toLowerCase().includes(q) ||
      info.flag.includes(q) ||
      info.symbol.includes(q)
    );
  }, [curSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (curRef.current && !curRef.current.contains(e.target)) {
        setCurOpen(false);
        setCurSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const CurPicker = () => (
    <div ref={curRef} style={{position:"relative",width:"100%"}}>
      <div
        onClick={() => {
          if (!curOpen) {
            setCurOpen(true);
          }
        }}
        style={{
          display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,cursor:"pointer",
          border: curOpen ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
          background: curOpen ? "rgba(59,130,246,0.04)" : "rgba(255,255,255,0.03)",
          transition:"all 0.2s", minHeight:48,
        }}
      >
        {!curOpen ? (
          <>
            <span style={{fontSize:"clamp(20px, 5.5vw, 22px)",flexShrink:0}}>{ci.flag}</span>
            <div style={{flex:1,minWidth:0}}>
              <span style={{color:"#E4E4E7",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700}}>{cur}</span>
              <span style={{color:"#71717A",fontSize:"clamp(12px, 3.2vw, 13px)",marginLeft:8}}>{ci.name}</span>
            </div>
            <span style={{color:"#52525B",fontSize:"clamp(11px, 3vw, 12px)",flexShrink:0}}>▼</span>
          </>
        ) : (
          <>
            <span style={{color:"#71717A",fontSize:"clamp(14px, 3.8vw, 15px)",flexShrink:0}}>🔍</span>
            <input
              ref={curInputRef}
              type="text"
              value={curSearch}
              onChange={e => setCurSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") { setCurOpen(false); setCurSearch(""); }
                if (e.key === "Enter" && curOptions.length > 0) {
                  setCur(curOptions[0][0]);
                  setCurOpen(false);
                  setCurSearch("");
                }
              }}
              placeholder="통화 검색 (USD, 달러...)"
              style={{
                flex:1,background:"transparent",border:"none",outline:"none",
                color:"#E4E4E7",fontSize:"clamp(14px, 3.8vw, 15px)",fontFamily:"inherit",minWidth:0,
              }}
            />
            <span onClick={(e) => { e.stopPropagation(); setCurOpen(false); setCurSearch(""); }}
              style={{color:"#71717A",fontSize:"clamp(13px, 3.5vw, 14px)",cursor:"pointer",padding:"4px 6px",flexShrink:0}}>✕</span>
          </>
        )}
      </div>

      {curOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:100,
            background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,
            boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxHeight:"min(280px, 50vh)",overflowY:"auto",
            pointerEvents: "auto",
          }}>
          {curOptions.length === 0 ? (
            <div style={{padding:"16px",color:"#52525B",fontSize:"clamp(12px, 3.2vw, 13px)",textAlign:"center"}}>
              검색 결과 없음
            </div>
          ) : (
            curOptions.map(([code, info]) => (
              <div
                key={code}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Currency clicked:", code);

                  // GA4 이벤트: 통화 변경
                  trackEvent('currency_change', {
                    from_currency: cur,
                    to_currency: code,
                    method: 'click'
                  });

                  setCur(code);
                  setCurOpen(false);
                  setCurSearch("");
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Currency touched:", code);

                  // GA4 이벤트: 통화 변경 (터치)
                  trackEvent('currency_change', {
                    from_currency: cur,
                    to_currency: code,
                    method: 'touch'
                  });

                  setCur(code);
                  setCurOpen(false);
                  setCurSearch("");
                }}
                style={{
                  display:"flex",alignItems:"center",gap:10,padding:"14px 16px",cursor:"pointer",minHeight:50,
                  background: cur === code ? "rgba(59,130,246,0.08)" : "transparent",
                  borderLeft: cur === code ? `3px solid ${info.color}` : "3px solid transparent",
                  transition:"background 0.1s",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
                onMouseEnter={e => { if(cur!==code) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if(cur!==code) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{fontSize:"clamp(20px, 5.5vw, 22px)",flexShrink:0}}>{info.flag}</span>
                <div style={{flex:1,minWidth:0}}>
                  <span style={{color: cur===code ? "#60A5FA" : "#E4E4E7", fontSize:"clamp(13px, 3.5vw, 14px)", fontWeight:700}}>{code}</span>
                  <span style={{color:"#A1A1AA",fontSize:"clamp(11px, 3vw, 12px)",marginLeft:8}}>{info.name}</span>
                </div>
                {cur === code && <span style={{color:"#60A5FA",fontSize:"clamp(13px, 3.5vw, 14px)",flexShrink:0}}>✓</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════
  // TAB: FAIR COMPARE (JSX variable — not a component, prevents remount)
  // ═══════════════════════════════════════════════════
  const compareContent = (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Non-business day info */}
      {bizDayBlocked && svcSnapshot.length > 0 && (
        <div style={{padding:"12px 16px",borderRadius:12,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.12)"}}>
          <p style={{color:"#F59E0B",fontSize:"clamp(13px, 3.5vw, 14px)",fontWeight:700,margin:"0 0 4px"}}>
            📅 현재 {getNonBusinessReason()}
          </p>
          <p style={{color:"#A1A1AA",fontSize:"clamp(11px, 3vw, 12px)",margin:0,lineHeight:1.5}}>
            🟢 핀테크: 신청 가능 (처리는 영업일) · 🔴 은행: 영업일만
          </p>
        </div>
      )}

      {/* Controls */}
      <div style={{background:"rgba(255,255,255,0.02)",borderRadius:14,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.04)"}}>
        {/* Currency */}
        <div style={{marginBottom:14}}>
          <span style={{color:"#A1A1AA",fontSize:"clamp(13px, 3.5vw, 14px)",fontWeight:600,display:"block",marginBottom:8}}>🌍 수취 통화</span>
          <CurPicker />
        </div>

        {/* Amount */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4}}>
            <span style={{color:"#A1A1AA",fontSize:"clamp(13px, 3.5vw, 14px)",fontWeight:600}}>💰 송금 금액</span>
            {amount > 0 && (
              <span style={{color:"#71717A",fontSize:"clamp(11px, 3vw, 12px)"}}>
                {amount >= 100000000 ? `${Math.floor(amount/100000000)}억 ` : ""}
                {amount % 100000000 >= 10000 ? `${Math.floor((amount%100000000)/10000).toLocaleString()}만` : ""}
                {amount % 10000 > 0 ? ` ${(amount%10000).toLocaleString()}` : ""}원
              </span>
            )}
          </div>
          <AmountInput amount={amount} setAmount={setAmount} />
        </div>

        {/* Compare button */}
        <style>{`
          @keyframes web3Shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes borderGlow {
            0%, 100% { border-color: rgba(6,182,212,0.4); box-shadow: 0 0 15px rgba(6,182,212,0.15), 0 0 30px rgba(139,92,246,0.08); }
            50% { border-color: rgba(139,92,246,0.4); box-shadow: 0 0 15px rgba(139,92,246,0.15), 0 0 30px rgba(6,182,212,0.08); }
          }
          .web3-btn:active:not(:disabled) { transform: scale(0.98); }
        `}</style>
        <button className="web3-btn" onClick={handleRefresh} disabled={dataLoading || fetchMode==="loading"} style={{
          width:"100%", padding:"16px", borderRadius:14,
          border: (dataLoading || fetchMode==="loading") ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(6,182,212,0.3)",
          cursor:(dataLoading || fetchMode==="loading")?"not-allowed":"pointer",
          background: (dataLoading || fetchMode==="loading")
            ? "rgba(255,255,255,0.03)"
            : "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.12), rgba(6,182,212,0.12), rgba(236,72,153,0.08))",
          backgroundSize: "400% 400%",
          animation: (dataLoading || fetchMode==="loading") ? "none" : "web3Shimmer 6s ease infinite, borderGlow 4s ease infinite",
          color: (dataLoading || fetchMode==="loading") ? "#52525B" : "#E4E4E7",
          fontSize:15, fontWeight:700,
          opacity: (dataLoading || fetchMode==="loading") ? 0.5 : 1,
          minHeight:54, position:"relative", overflow:"hidden",
        }}>
          {!(dataLoading || fetchMode==="loading") && <span style={{
            position:"absolute", top:0, left:"-100%", width:"200%", height:"100%",
            background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
            animation:"web3Shimmer 3s ease infinite", pointerEvents:"none",
          }} />}
          <span style={{position:"relative",zIndex:1}}>
            {dataLoading ? "⏳ 로딩 중..." :
             fetchMode==="loading" ? "🔄 환율 조회 중..." :
             amount > 0 ? `⚖️ ₩${amount.toLocaleString()} → ${cur} 실시간 비교` : "금액을 입력하세요"}
          </span>
        </button>
      </div>

      {/* Status bar — compact (only show when data is loaded or loading) */}
      {(fetchMode !== "idle" || svcSnapshot.length > 0) && (
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.03)",flexWrap:"wrap"}}>
          <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.5)}}`}</style>
          {fetchMode==="loading" && <div style={{width:8,height:8,borderRadius:"50%",background:"#3B82F6",animation:"pulse 2s infinite",flexShrink:0}} />}
          {fetchMode==="live" && <div style={{width:8,height:8,borderRadius:"50%",background:"#22C55E",flexShrink:0}} />}
          {fetchMode==="cached" && <div style={{width:8,height:8,borderRadius:"50%",background:"#EAB308",flexShrink:0}} />}
          {fetchMode==="error" && <div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444",flexShrink:0}} />}
          <span style={{color:"#A1A1AA",fontSize:"clamp(11px, 3vw, 12px)",lineHeight:1.4}}>
            {fetchMode==="loading" ? "조회 중..." :
             fetchMode==="live" ? "실시간 환율" :
             fetchMode==="cached" ? "저장 환율" :
             fetchMode==="error" ? "데이터 없음" : "대기"}
            {midRate && <> · <strong style={{color:"#E4E4E7"}}>₩{midRate.toLocaleString()}</strong>/{cur}</>}
            {lastUpdate && <> · {lastUpdate.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</>}
          </span>
        </div>
      )}

      {/* Service cards (mobile-first) */}
      {svcSnapshot.length > 0 ? (
        <>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {svcSnapshot.map((s,i)=>{
              const unavailable = bizDayBlocked && !s.avail.weekend;
              const isTop = i === 0;
              return (
                <div key={s.id} style={{
                  padding:"14px 16px", borderRadius:14,
                  background: isTop ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)",
                  border: isTop ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(255,255,255,0.04)",
                  opacity: unavailable ? 0.45 : 1,
                }}>
                  {/* Row 1: Rank + Name + Amount received */}
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:8}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:8,flex:1,minWidth:0}}>
                      <span style={{fontSize:"clamp(16px, 4.5vw, 18px)",flexShrink:0}}>{isTop?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</span>
                      <div style={{minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
                          <span style={{color:"#E4E4E7",fontSize:"clamp(14px, 3.8vw, 15px)",fontWeight:700}}>{s.name}</span>
                          {bizDayBlocked && (
                            <span style={{
                              padding:"3px 7px", borderRadius:4, fontSize:"clamp(9px, 2.3vw, 10px)", fontWeight:600,
                              background: s.avail.weekend ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                              color: s.avail.weekend ? "#22C55E" : "#EF4444",
                              whiteSpace:"nowrap",
                            }}>
                              {s.avail.weekend ? "신청가능" : "영업일만"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <p style={{color:isTop?"#22C55E":"#E4E4E7",fontSize:"clamp(15px, 4.2vw, 17px)",fontWeight:800,margin:0,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                        {ci.symbol}{s.foreignAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </p>
                      <p style={{color:"#52525B",fontSize:"clamp(9px, 2.3vw, 10px)",margin:0}}>실수령</p>
                    </div>
                  </div>
                  {/* Row 2: Details */}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{color:"#A1A1AA",fontSize:"clamp(11px, 2.8vw, 12px)",background:"rgba(255,255,255,0.03)",padding:"4px 8px",borderRadius:6,whiteSpace:"nowrap"}}>
                      수수료 {s.fee===0?<span style={{color:"#22C55E"}}>무료</span>:`₩${s.fee.toLocaleString()}`}
                    </span>
                    <span style={{color:s.spread>2?"#EF4444":s.spread>1?"#EAB308":"#22C55E",fontSize:"clamp(11px, 2.8vw, 12px)",background:"rgba(255,255,255,0.03)",padding:"4px 8px",borderRadius:6,whiteSpace:"nowrap"}}>
                      스프레드 {s.spread}%
                    </span>
                    <span style={{color:"#71717A",fontSize:"clamp(11px, 2.8vw, 12px)",background:"rgba(255,255,255,0.03)",padding:"4px 8px",borderRadius:6,whiteSpace:"nowrap"}}>
                      {s.speed}
                    </span>
                  </div>
                  {/* Promotions */}
                  {s.promotions && (
                    <p style={{color:"#F59E0B",fontSize:"clamp(10px, 2.5vw, 11px)",margin:"6px 0 0",lineHeight:1.4}}>🏷️ {s.promotions}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Savings highlight */}
          {svcSnapshot.length >= 2 && (
            <div style={{padding:"14px 16px",borderRadius:14,background:"rgba(34,197,94,0.04)",border:"1px solid rgba(34,197,94,0.1)"}}>
              <p style={{color:"#22C55E",fontSize:"clamp(13px, 3.5vw, 14px)",fontWeight:700,margin:0,lineHeight:1.5}}>
                💡 {svcSnapshot[0].name} 이용 시 최대 ₩{(svcSnapshot[svcSnapshot.length-1].totalCost - svcSnapshot[0].totalCost).toLocaleString()} 절감
              </p>
              <p style={{color:"#A1A1AA",fontSize:"clamp(11px, 3vw, 12px)",margin:"4px 0 0",lineHeight:1.4}}>
                vs {svcSnapshot[svcSnapshot.length-1].name} 대비 · {ci.symbol}{(svcSnapshot[0].foreignAmount - svcSnapshot[svcSnapshot.length-1].foreignAmount).toFixed(2)} 더 수령
              </p>
            </div>
          )}

          {/* Chart */}
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:14,padding:"12px 10px",border:"1px solid rgba(255,255,255,0.04)",overflowX:"auto"}}>
            <p style={{color:"#A1A1AA",fontSize:"clamp(11px, 3vw, 12px)",margin:"0 0 8px",fontWeight:600,paddingLeft:4}}>실수령 비교 · ₩{amount.toLocaleString()} → {cur}</p>
            <ResponsiveContainer width="100%" height={Math.max(260, svcSnapshot.length * 40)} minWidth={300}>
              <BarChart data={svcSnapshot} layout="vertical" margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)"/>
                <XAxis type="number" tick={{fill:"#71717A",fontSize:"clamp(9px, 2.3vw, 10px)"}} tickFormatter={v=>`${ci.symbol}${v.toFixed(0)}`}/>
                <YAxis dataKey="kr" type="category" tick={{fill:"#A1A1AA",fontSize:"clamp(10px, 2.5vw, 11px)"}} width={60}/>
                <Tooltip content={<CTooltip/>}/>
                <Bar dataKey="foreignAmount" name={`실수령(${cur})`} radius={[0,4,4,0]}>
                  {svcSnapshot.map((s,i) => (
                    <Cell key={s.id} fill={i===0?"#22C55E":i<3?"#3B82F6":"#52525B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ad Slot 1: After comparison results */}
          <AdSenseAd
            slot="1234567890"
            format="auto"
            responsive={true}
            style={{ minHeight: 90 }}
          />

          {/* Disclaimer — minimal */}
          <p style={{color:"#52525B",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0,lineHeight:1.6,padding:"0 4px"}}>
            ※ 환율은 조회 시점 실시간, 수수료는 자동 갱신 기반. 실제 금액은 각 서비스에서 확인하세요. <span style={{color:"#3B82F6"}}>특정 서비스를 추천하지 않습니다.</span>
          </p>
        </>
      ) : (
        <div style={{textAlign:"center",padding:"40px 20px",color:"#52525B"}}>
          <p style={{fontSize:"clamp(32px, 10vw, 40px)",margin:"0 0 12px"}}>⚖️</p>
          <p style={{fontSize:"clamp(14px, 3.8vw, 15px)",margin:0,fontWeight:600,lineHeight:1.5}}>
            {dataLoading ? "데이터 로딩 중..." : fetchMode==="error" ? `${cur} 데이터 없음` : "금액 입력 후 비교 버튼을 눌러주세요"}
          </p>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════
  // TAB: RATE ANALYSIS
  // ═══════════════════════════════════════════════════
  const RateTab = () => {
    const yearly = useMemo(()=>[2020,2021,2022,2023,2024,2025].map(y=>{
      const yd=hist.filter(d=>d.d.startsWith(String(y)));const rs=yd.map(d=>d.r);
      return{year:y,avg:rs.length?Math.round(rs.reduce((a,b)=>a+b,0)/rs.length):0,min:rs.length?Math.min(...rs):0,max:rs.length?Math.max(...rs):0,vol:rs.length?Math.max(...rs)-Math.min(...rs):0,chg:rs.length>1?((rs[rs.length-1]-rs[0])/rs[0]*100).toFixed(1):"0"};
    }),[hist]);

    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:1,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 100%",marginBottom:8}}><CurPicker/></div>
          {["all","2020","2021","2022","2023","2024","2025"].map(y=>(
            <button key={y} onClick={()=>setSelectedYear(y)} style={{
              padding:"8px 10px",borderRadius:10,border:"none",cursor:"pointer",
              background:selectedYear===y?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.02)",
              color:selectedYear===y?"#fff":"#52525B",fontSize:"clamp(11px, 2.8vw, 12px)",fontWeight:600,
              minHeight:36,flex:"1 0 auto",
            }}>{y==="all"?"전체":y}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:8}}>
          {[{l:"현재",v:`₩${curRate.toLocaleString()}`,a:ci.color},{l:"5년 평균",v:`₩${avg.toLocaleString()}`,a:"#3B82F6"},{l:"최저/최고",v:`${mn}~${mx}`,a:"#EAB308"},{l:"시그널",v:sig.s,a:sig.c}].map((k,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"12px",border:"1px solid rgba(255,255,255,0.04)",borderTop:`2px solid ${k.a}`}}>
              <p style={{color:"#52525B",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0}}>{k.l}</p>
              <p style={{color:"#fff",fontSize:"clamp(15px, 4.5vw, 18px)",fontWeight:700,margin:"4px 0 0",fontFamily:"'JetBrains Mono',sans-serif",wordBreak:"break-word"}}>{k.v}</p>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 8px",border:"1px solid rgba(255,255,255,0.04)",overflowX:"auto"}}>
          <ResponsiveContainer width="100%" height={280} minWidth={300}>
            <AreaChart data={filteredHist} margin={{left:0,right:10,top:5,bottom:5}}>
              <defs><linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ci.color} stopOpacity={0.15}/><stop offset="100%" stopColor={ci.color} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
              <XAxis dataKey="d" tick={{fill:"#52525B",fontSize:"clamp(8px, 2vw, 9px)"}} tickFormatter={v=>v.slice(2)} interval={selectedYear==="all"?5:0}/>
              <YAxis tick={{fill:"#52525B",fontSize:"clamp(8px, 2vw, 9px)"}} domain={["dataMin-15","dataMax+15"]}/>
              <Tooltip content={<CTooltip/>}/>
              <ReferenceLine y={avg} stroke="#EAB308" strokeDasharray="4 4"/>
              <Area type="monotone" dataKey="r" stroke={ci.color} fill="url(#ag2)" strokeWidth={2} name={`${cur}/KRW`}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 8px",border:"1px solid rgba(255,255,255,0.04)",overflowX:"auto"}}>
            <p style={{color:"#71717A",fontSize:"clamp(10px, 2.5vw, 11px)",margin:"0 0 8px",fontWeight:600,paddingLeft:6}}>연도별 변동률</p>
            <ResponsiveContainer width="100%" height={180} minWidth={280}>
              <BarChart data={yearly} margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)"/>
                <XAxis dataKey="year" tick={{fill:"#52525B",fontSize:"clamp(8px, 2vw, 9px)"}}/>
                <YAxis tick={{fill:"#52525B",fontSize:"clamp(7px, 1.8vw, 8px)"}} unit="%"/>
                <Tooltip content={<CTooltip/>}/>
                <Bar dataKey="chg" name="변동률(%)" radius={[2,2,0,0]}>{yearly.map((e,i)=><Cell key={i} fill={parseFloat(e.chg)>0?"#EF4444":"#22C55E"} fillOpacity={0.6}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 8px",border:"1px solid rgba(255,255,255,0.04)",overflowX:"auto"}}>
            <p style={{color:"#71717A",fontSize:"clamp(10px, 2.5vw, 11px)",margin:"0 0 8px",fontWeight:600,paddingLeft:6}}>연도별 평균·범위</p>
            <ResponsiveContainer width="100%" height={180} minWidth={280}>
              <ComposedChart data={yearly} margin={{left:0,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)"/>
                <XAxis dataKey="year" tick={{fill:"#52525B",fontSize:"clamp(8px, 2vw, 9px)"}}/>
                <YAxis tick={{fill:"#52525B",fontSize:"clamp(7px, 1.8vw, 8px)"}} domain={["dataMin-15","dataMax+15"]}/>
                <Tooltip content={<CTooltip/>}/>
                <Line type="monotone" dataKey="avg" stroke={ci.color} strokeWidth={2} dot={{r:2.5,fill:ci.color}} name="평균"/>
                <Line type="monotone" dataKey="min" stroke="#3B82F6" strokeWidth={1} strokeDasharray="3 3" dot={false} name="최저"/>
                <Line type="monotone" dataKey="max" stroke="#EF4444" strokeWidth={1} strokeDasharray="3 3" dot={false} name="최고"/>
                <Legend wrapperStyle={{fontSize:"clamp(8px, 2vw, 9px)"}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ad Slot 3: In History tab */}
        <AdSenseAd
          slot="1122334455"
          format="auto"
          responsive={true}
          style={{ minHeight: 90 }}
        />
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  // TAB: TIMING
  // ═══════════════════════════════════════════════════
  const TimingTab = () => {
    const bestSend=[...seasonalData].sort((a,b)=>a.avg-b.avg).slice(0,3);
    const bestRecv=[...seasonalData].sort((a,b)=>b.avg-a.avg).slice(0,3);
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {["outbound","inbound"].map(d=>(
            <button key={d} onClick={()=>setDirection(d)} style={{
              padding:"10px 14px",borderRadius:12,border:"none",cursor:"pointer",
              background:direction===d?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.02)",
              color:direction===d?"#fff":"#52525B",fontSize:"clamp(11px, 2.8vw, 12px)",fontWeight:600,
              flex:"1 0 auto",minHeight:44,
            }}>{d==="outbound"?"🇰🇷→ 해외송금":"→🇰🇷 수취"}</button>
          ))}
          <div style={{flex:"1 1 100%",marginTop:8}}><CurPicker/></div>
        </div>
        <div style={{padding:"12px 14px",borderRadius:10,background:`${sig.c}08`,border:`1px solid ${sig.c}12`,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"clamp(24px, 7vw, 28px)",flexShrink:0}}>{sig.i}</span>
          <div style={{minWidth:0}}>
            <p style={{color:sig.c,margin:0,fontSize:"clamp(16px, 4.5vw, 18px)",fontWeight:800}}>{sig.s}</p>
            <p style={{color:"#71717A",margin:"2px 0 0",fontSize:"clamp(10px, 2.5vw, 11px)",lineHeight:1.4}}>{ci.flag} {cur} · ₩{curRate.toLocaleString()} · 평균 ₩{avg.toLocaleString()}</p>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 8px",border:"1px solid rgba(255,255,255,0.04)",overflowX:"auto"}}>
          <ResponsiveContainer width="100%" height={240} minWidth={300}>
            <ComposedChart data={seasonalData} margin={{left:0,right:10,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)"/>
              <XAxis dataKey="label" tick={{fill:"#52525B",fontSize:"clamp(8px, 2vw, 9px)"}}/>
              <YAxis tick={{fill:"#52525B",fontSize:"clamp(7px, 1.8vw, 8px)"}} domain={["dataMin-10","dataMax+10"]}/>
              <Tooltip content={<CTooltip/>}/>
              <Bar dataKey="avg" name="월별 평균" radius={[2,2,0,0]}>{seasonalData.map((e,i)=>{
                const isBest=direction==="outbound"?bestSend.some(m=>m.m===e.m):bestRecv.some(m=>m.m===e.m);
                return <Cell key={i} fill={isBest?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)"}/>;
              })}</Bar>
              <Line type="monotone" dataKey="max" stroke="#EF4444" strokeWidth={1} strokeDasharray="3 3" dot={false} name="최고"/>
              <Line type="monotone" dataKey="min" stroke="#3B82F6" strokeWidth={1} strokeDasharray="3 3" dot={false} name="최저"/>
              <ReferenceLine y={avg} stroke="#EAB308" strokeDasharray="3 3"/>
              <Legend wrapperStyle={{fontSize:"clamp(8px, 2vw, 9px)"}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
          {[{t:"해외송금 BEST (환율 낮을 때)",d:bestSend},{t:"수취 BEST (환율 높을 때)",d:bestRecv}].map((sec,si)=>(
            <div key={si} style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.04)"}}>
              <p style={{color:"#71717A",fontSize:"clamp(10px, 2.5vw, 11px)",margin:"0 0 8px",fontWeight:600}}>{sec.t}</p>
              {sec.d.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 10px",borderRadius:6,marginBottom:4,background:"rgba(255,255,255,0.02)",gap:8}}>
                  <span style={{color:"#A1A1AA",fontSize:"clamp(11px, 2.8vw, 12px)",fontWeight:600}}>{i+1}위 · {m.label}</span>
                  <span style={{color:"#E4E4E7",fontSize:"clamp(11px, 2.8vw, 12px)",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>₩{m.avg.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  // TAB: MULTI
  // ═══════════════════════════════════════════════════
  const MultiTab = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {Object.entries(CURRENCIES).map(([code,info])=>(
          <button key={code} onClick={()=>setMultiCur(prev=>prev.includes(code)?prev.filter(c=>c!==code):[...prev,code])} style={{
            padding:"8px 10px",borderRadius:10,border:"none",cursor:"pointer",
            background:multiCur.includes(code)?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.02)",
            color:multiCur.includes(code)?"#fff":"#52525B",fontSize:"clamp(10px, 2.5vw, 11px)",fontWeight:600,
            outline:multiCur.includes(code)?`1px solid ${info.color}`:"none",
            flex:"0 0 auto",minHeight:36,
          }}>{info.flag} {code}</button>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 8px",border:"1px solid rgba(255,255,255,0.04)",overflowX:"auto"}}>
        <p style={{color:"#71717A",fontSize:"clamp(10px, 2.5vw, 11px)",margin:"0 0 8px",fontWeight:600,paddingLeft:4}}>정규화 지수 (2020-01=100)</p>
        <ResponsiveContainer width="100%" height={280} minWidth={300}>
          <LineChart data={(()=>{
            const dates=HIST.USD.map(d=>d.d);
            return dates.map((date,i)=>{const pt={date};multiCur.forEach(code=>{const h=HIST[code];if(h&&h[0]&&h[i])pt[code]=Math.round((h[i].r/h[0].r)*10000)/100;});return pt;});
          })()} margin={{left:0,right:10,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)"/>
            <XAxis dataKey="date" tick={{fill:"#52525B",fontSize:"clamp(7px, 1.8vw, 8px)"}} tickFormatter={v=>v.slice(2)} interval={5}/>
            <YAxis tick={{fill:"#52525B",fontSize:"clamp(7px, 1.8vw, 8px)"}} domain={["dataMin-3","dataMax+3"]}/>
            <Tooltip content={<CTooltip/>}/>
            <ReferenceLine y={100} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3"/>
            {multiCur.map(code=><Line key={code} type="monotone" dataKey={code} stroke={CURRENCIES[code].color} strokeWidth={2} dot={false} name={`${CURRENCIES[code].flag} ${code}`}/>)}
            <Legend wrapperStyle={{fontSize:"clamp(8px, 2vw, 9px)"}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"10px 8px",border:"1px solid rgba(255,255,255,0.04)",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{width:"100%",minWidth:550,borderCollapse:"separate",borderSpacing:"0 2px"}}>
          <thead><tr>{["통화","현재","5년 평균","최저","최고","편차","시그널"].map(h=><th key={h} style={{color:"#52525B",fontSize:"clamp(9px, 2.3vw, 10px)",fontWeight:600,padding:"6px 7px",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{Object.entries(CURRENCIES).map(([code,info])=>{
            const h=HIST[code]||[];const lr=info.base;const a=h.length?Math.round(h.reduce((s,d)=>s+d.r,0)/h.length):0;const n=h.length?Math.min(...h.map(d=>d.r)):0;const x=h.length?Math.max(...h.map(d=>d.r)):0;const sg=getSignal(lr,a);
            return(<tr key={code}><td style={{padding:"8px 7px",whiteSpace:"nowrap"}}><span style={{fontSize:"clamp(11px, 2.8vw, 12px)"}}>{info.flag}</span> <span style={{color:"#D4D4D8",fontSize:"clamp(10px, 2.5vw, 11px)",fontWeight:600}}>{code}</span></td><td style={{color:"#fff",fontSize:"clamp(11px, 2.8vw, 12px)",fontWeight:700,padding:"8px 7px",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>₩{lr.toLocaleString()}</td><td style={{color:"#A1A1AA",fontSize:"clamp(10px, 2.5vw, 11px)",padding:"8px 7px",whiteSpace:"nowrap"}}>₩{a.toLocaleString()}</td><td style={{color:"#3B82F6",fontSize:"clamp(10px, 2.5vw, 11px)",padding:"8px 7px",whiteSpace:"nowrap"}}>₩{n.toLocaleString()}</td><td style={{color:"#EF4444",fontSize:"clamp(10px, 2.5vw, 11px)",padding:"8px 7px",whiteSpace:"nowrap"}}>₩{x.toLocaleString()}</td><td style={{color:(lr-a)>0?"#EF4444":"#22C55E",fontSize:"clamp(10px, 2.5vw, 11px)",fontWeight:600,padding:"8px 7px",whiteSpace:"nowrap"}}>{a?((lr-a)/a*100).toFixed(1):0}%</td><td style={{padding:"8px 7px",whiteSpace:"nowrap"}}><span style={{color:sg.c,fontSize:"clamp(9px, 2.3vw, 10px)",fontWeight:600}}>{sg.i} {sg.s}</span></td></tr>);
          })}</tbody>
        </table>
      </div>

      {/* Ad Slot 2: In Multi Currency tab */}
      <AdSenseAd
        slot="0987654321"
        format="auto"
        responsive={true}
        style={{ minHeight: 90 }}
      />
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#09090B",color:"#fff",fontFamily:"'Pretendard','JetBrains Mono',-apple-system,sans-serif",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.04)",padding:"12px 16px 0"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:"clamp(22px, 5vw, 26px)"}}>⚖️</span>
              <div>
                <h1 style={{margin:0,fontSize:"clamp(16px, 4vw, 18px)",fontWeight:800,letterSpacing:-0.3}}>해외송금 공정 비교</h1>
                <p style={{color:"#52525B",fontSize:"clamp(10px, 2.5vw, 11px)",margin:0}}>실시간 · 8개 서비스 · 편향 없음</p>
              </div>
            </div>
            <button
              onClick={() => {
                // PWA 설치 프롬프트 트리거
                if (window.deferredPrompt) {
                  window.deferredPrompt.prompt();
                  window.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                      trackEvent('pwa_install_from_button', { source: 'header' });
                    }
                    window.deferredPrompt = null;
                  });
                } else {
                  // 이미 설치되었거나 지원 안 함
                  if (window.matchMedia('(display-mode: standalone)').matches) {
                    alert('이미 앱으로 설치되어 있습니다! 🎉');
                  } else {
                    alert('앱 설치는 모바일 브라우저에서 가능합니다.\n\n• Android: 메뉴(⋮) → "홈 화면에 추가"\n• iOS: 공유(□↑) → "홈 화면에 추가"');
                  }
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontSize: 'clamp(11px, 2.8vw, 12px)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              📱 <span style={{display: window.innerWidth >= 400 ? 'inline' : 'none'}}>앱 </span>다운로드
            </button>
          </div>
          <div style={{display:"flex",gap:2,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none"}}>
            <style>{`
              .tab-container::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="tab-container" style={{display:"flex",gap:2,minWidth:"100%"}}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>{
                  // GA4 이벤트: 탭 변경
                  trackEvent('tab_change', {
                    from_tab: tab,
                    to_tab: t.id
                  });
                  setTab(t.id);
                }} style={{
                  padding:"10px 12px",borderRadius:"6px 6px 0 0",border:"none",cursor:"pointer",
                  background:tab===t.id?"rgba(255,255,255,0.04)":"transparent",
                  color:tab===t.id?"#E4E4E7":"#52525B",fontSize:"clamp(11px, 2.8vw, 12px)",fontWeight:tab===t.id?700:500,
                  borderBottom:tab===t.id?"2px solid #71717A":"2px solid transparent",
                  transition:"all 0.15s",whiteSpace:"nowrap",flex:"1 0 auto",minHeight:44,
                }}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"14px 16px 32px"}}>
        <div style={{display: tab==="compare" ? "block" : "none"}}>{compareContent}</div>
        <div style={{display: tab==="rate" ? "block" : "none"}}><RateTab/></div>
        <div style={{display: tab==="timing" ? "block" : "none"}}><TimingTab/></div>
        <div style={{display: tab==="multi" ? "block" : "none"}}><MultiTab/></div>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.02)",padding:"12px 16px",textAlign:"center"}}>
        <p style={{color:"#3F3F46",fontSize:"clamp(9px, 2.3vw, 10px)",margin:0,lineHeight:1.5}}>⚖️ 환율 API + Wise 비교 API · 자동 갱신 · 운영비 $0</p>
      </div>
    </div>
  );
}
