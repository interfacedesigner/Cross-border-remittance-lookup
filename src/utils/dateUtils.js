// ═══════════════════════════════════════════════════
// BUSINESS DAY CHECK (KST, Korean holidays)
// ═══════════════════════════════════════════════════

// Korean public holidays (fixed + lunar-based approximations for 2025-2026)
const KOREAN_HOLIDAYS = [
  // 2025
  "2025-01-01","2025-01-28","2025-01-29","2025-01-30",
  "2025-03-01","2025-05-01","2025-05-05","2025-05-06",
  "2025-06-06","2025-08-15",
  "2025-10-03","2025-10-05","2025-10-06","2025-10-07",
  "2025-10-09","2025-12-25",
  // 2026
  "2026-01-01","2026-02-16","2026-02-17","2026-02-18",
  "2026-03-01","2026-05-01","2026-05-05","2026-05-24",
  "2026-06-06","2026-08-15",
  "2026-09-24","2026-09-25","2026-09-26",
  "2026-10-03","2026-10-09","2026-12-25",
];

export const getKST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 3600000);
};

const formatDateStr = (date) =>
  `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

export const isBusinessDay = () => {
  const kst = getKST();
  const day = kst.getDay();
  if (day === 0 || day === 6) return false;
  if (KOREAN_HOLIDAYS.includes(formatDateStr(kst))) return false;
  return true;
};

export const getNextBusinessDay = () => {
  const kst = getKST();
  const dayNames = ['일','월','화','수','목','금','토'];
  let next = new Date(kst);
  for (let i = 0; i < 10; i++) {
    next.setDate(next.getDate() + 1);
    const d = next.getDay();
    const ds = formatDateStr(next);
    if (d !== 0 && d !== 6 && !KOREAN_HOLIDAYS.includes(ds)) {
      return `${next.getMonth()+1}월 ${next.getDate()}일 (${dayNames[d]})`;
    }
  }
  return "다음 영업일";
};

export const getNonBusinessReason = () => {
  const kst = getKST();
  const day = kst.getDay();
  const dateStr = formatDateStr(kst);
  if (KOREAN_HOLIDAYS.includes(dateStr)) return "공휴일";
  if (day === 0) return "일요일";
  if (day === 6) return "토요일";
  return "";
};
