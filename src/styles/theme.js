// ═══════════════════════════════════════════════════
// DENYX DESIGN SYSTEM — TOKENS (Light + Dark)
// Source: Denyx DS tokens.css :root + .dark blocks
// ═══════════════════════════════════════════════════

const light = {
  bgPrimary: "#FFFFFF", bgLayer: "#F7F8FA", bgCard: "#F7F8FA",
  bgCardHover: "#EFF0F3", bgOverlay: "rgba(0,0,0,0.45)",
  border: "#E5E7EB", borderLight: "#F0F1F3", borderHover: "#D1D5DB",
  borderInput: "#D1D5DB", borderFocus: "#296CF2",
  text: "#222222", textBright: "#111111", textMuted: "#4C4C4C",
  textDim: "#757575", textDark: "#949494", textDarker: "#B0B0B0",
  accent: "#296CF2", accentDeep: "#1B5CD9", accentSoft: "#3DA9FF",
  accentBg: "#D6E1FF", accentBorder: "rgba(41,108,242,0.3)",
  success: "#00B442", warning: "#FFA012", danger: "#F34646", info: "#296CF2",
  critical: "#E53935", indicatorWarning: "#F0B400",
  toneHighBg: "#FFE8E8", toneMidBg: "#FFF7E0", toneLowBg: "#E8F4FF", toneIdleBg: "#F1F2F4",
  chartGrid: "#E5E7EB", chartFill: "#F7F8FA",
  orange: "#FFA012", cyan: "#06B6D4", purple: "#8B5CF6",
  // Semantic alpha tokens
  gridStroke: "rgba(0,0,0,0.06)",
  shimmer: "rgba(0,0,0,0.03)",
  shadow: "rgba(0,0,0,0.15)",
  shadowStrong: "rgba(0,0,0,0.2)",
  accentBgSoft: "rgba(41,108,242,0.08)",
  accentBorderSoft: "rgba(41,108,242,0.2)",
  successBgSoft: "rgba(0,180,66,0.04)",
  successBorderSoft: "rgba(0,180,66,0.15)",
  successBgMed: "rgba(0,180,66,0.1)",
  successBarFill: "rgba(0,180,66,0.5)",
  dangerBgSoft: "rgba(243,70,70,0.1)",
  dangerBarFill: "rgba(243,70,70,0.5)",
  warningBgSoft: "rgba(255,160,18,0.05)",
  warningBorderSoft: "rgba(255,160,18,0.12)",
};

const dark = {
  bgPrimary: "#0E1116", bgLayer: "#14181E", bgCard: "#181C22",
  bgCardHover: "#1B2026", bgOverlay: "rgba(0,0,0,0.7)",
  border: "#2A2F39", borderLight: "#21262E", borderHover: "#353B46",
  borderInput: "#2A2F39", borderFocus: "#5A9AFF",
  text: "#E9EBEE", textBright: "#F0F2F4", textMuted: "#B7BDC6",
  textDim: "#8B929C", textDark: "#5C636E", textDarker: "#4A515C",
  accent: "#5A9AFF", accentDeep: "#296CF2", accentSoft: "#7FB0FF",
  accentBg: "#1A2A3E", accentBorder: "rgba(90,154,255,0.3)",
  success: "#00B442", warning: "#FFA012", danger: "#F34646", info: "#5A9AFF",
  critical: "#E53935", indicatorWarning: "#F0B400",
  toneHighBg: "#3A1C1C", toneMidBg: "#3A3018", toneLowBg: "#1A2A3E", toneIdleBg: "#1B2026",
  chartGrid: "#21262E", chartFill: "#14181E",
  orange: "#FFA012", cyan: "#1b9bd0", purple: "#8B52FF",
  // Semantic alpha tokens
  gridStroke: "rgba(255,255,255,0.06)",
  shimmer: "rgba(255,255,255,0.03)",
  shadow: "rgba(0,0,0,0.4)",
  shadowStrong: "rgba(0,0,0,0.5)",
  accentBgSoft: "rgba(90,154,255,0.1)",
  accentBorderSoft: "rgba(90,154,255,0.25)",
  successBgSoft: "rgba(0,180,66,0.08)",
  successBorderSoft: "rgba(0,180,66,0.2)",
  successBgMed: "rgba(0,180,66,0.15)",
  successBarFill: "rgba(0,180,66,0.5)",
  dangerBgSoft: "rgba(243,70,70,0.15)",
  dangerBarFill: "rgba(243,70,70,0.5)",
  warningBgSoft: "rgba(255,160,18,0.08)",
  warningBorderSoft: "rgba(255,160,18,0.18)",
};

export function getColors(mode) { return mode === "dark" ? dark : light; }
export const colors = light; // default export for backward compat

// ── Typography Tokens ─────────────────────────────
export const fonts = {
  primary: "'Noto Sans', 'Noto Sans KR', sans-serif",
  numeric: "Roboto, 'Noto Sans', sans-serif",
};

// ── Type Scale (11 steps) ─────────────────────────
export const typeScale = {
  chart: 9,
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  "4xl": 32,
  "5xl": 48,
};

// ── Font Weight ───────────────────────────────────
export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

// ── Line Height ───────────────────────────────────
export const lineHeight = {
  none: 1.0,
  tight: 1.2,
  snug: 1.3,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.6,
  spacious: 1.7,
  airy: 1.8,
};

// ── Letter Spacing ────────────────────────────────
export const tracking = {
  display: "-0.3px",
  metric: "-0.2px",
  default: "-0.1px",
  caps: "0.3px",
};

// ── Spacing ───────────────────────────────────────
export const spacing = {
  "2xs": 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  "2xl": 14,
  "3xl": 16,
  "4xl": 20,
  "5xl": 24,
  "6xl": 28,
  "7xl": 32,
};

// ── Border Radius ─────────────────────────────────
export const radius = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  "2xl": 12,
  "3xl": 14,
  "4xl": 16,
  "5xl": 20,
  pill: 50,
  full: 9999,
};

// ── Constants ─────────────────────────────────────
export const SEND_AMOUNT_DEFAULT = 1000000;
export const MIN_AMOUNT = 10000;
export const MAX_AMOUNT = 999999999;
export const DEBOUNCE_MS = 500;
export const RATE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
