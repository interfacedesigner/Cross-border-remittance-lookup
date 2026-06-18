// ═══════════════════════════════════════════════════
// CURRENCIES & SERVICE AVAILABILITY
// ═══════════════════════════════════════════════════
export const CURRENCIES = {
  USD:{code:"USD",name:"미국 달러",flag:"🇺🇸",symbol:"$",color:"#22C55E",base:1474},
  JPY:{code:"JPY",name:"일본 엔(100)",flag:"🇯🇵",symbol:"¥",color:"#EF4444",unit:100,base:938},
  EUR:{code:"EUR",name:"유로",flag:"🇪🇺",symbol:"€",color:"#3B82F6",base:1545},
  GBP:{code:"GBP",name:"영국 파운드",flag:"🇬🇧",symbol:"£",color:"#F59E0B",base:1885},
  CNY:{code:"CNY",name:"중국 위안",flag:"🇨🇳",symbol:"¥",color:"#F97316",base:201},
  AUD:{code:"AUD",name:"호주 달러",flag:"🇦🇺",symbol:"A$",color:"#06B6D4",base:952},
  CAD:{code:"CAD",name:"캐나다 달러",flag:"🇨🇦",symbol:"C$",color:"#DC2626",base:1025},
  SGD:{code:"SGD",name:"싱가포르 달러",flag:"🇸🇬",symbol:"S$",color:"#8B5CF6",base:1132},
};

export const SVC_AVAIL = {
  wise:      { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  sentbe:    { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  moin:      { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  wirebarley:{ weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  toss:      { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  paypal:    { weekend: true,  holiday: true,  label: "24시간 신청 가능", processNote: "처리는 영업일" },
  hana:      { weekend: false, holiday: false, label: "영업일만 가능",   processNote: "09:00~16:00" },
  shinhan:   { weekend: false, holiday: false, label: "영업일만 가능",   processNote: "09:00~16:00" },
};
