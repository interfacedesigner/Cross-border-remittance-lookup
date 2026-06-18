// ═══════════════════════════════════════════════════
// THEME & DESIGN TOKENS
// ═══════════════════════════════════════════════════
export const colors = {
  bgPrimary: "#09090B",
  bgCard: "rgba(255,255,255,0.02)",
  bgCardHover: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.04)",
  borderHover: "rgba(255,255,255,0.12)",
  borderInput: "rgba(255,255,255,0.08)",
  text: "#E4E4E7",
  textBright: "#F4F4F5",
  textMuted: "#A1A1AA",
  textDim: "#71717A",
  textDark: "#52525B",
  textDarker: "#3F3F46",
  accent: "#60A5FA",
  accentBg: "rgba(96,165,250,0.1)",
  accentBorder: "rgba(96,165,250,0.3)",
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
  info: "#3B82F6",
  orange: "#F59E0B",
  cyan: "#06B6D4",
  purple: "#8B5CF6",
};

export const fonts = {
  primary: "'Pretendard','JetBrains Mono',-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono',monospace",
};

export const SEND_AMOUNT_DEFAULT = 1000000;
export const MIN_AMOUNT = 10000;
export const MAX_AMOUNT = 999999999;
export const DEBOUNCE_MS = 500;
export const RATE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
