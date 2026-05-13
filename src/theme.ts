// Saheli — Editorial Bharat design system.
// Cream + indigo + ink-teal + taupe. Sindoor reserved for distress.
// Old token names retained as aliases so existing imports keep compiling;
// they redirect to the closest Editorial Bharat equivalent.

export const fonts = {
  hiDisplay: 'TiroDevanagariHindi_400Regular',
  hiDisplayItalic: 'TiroDevanagariHindi_400Regular_Italic',
  enDisplay: 'Fraunces_600SemiBold',
  enDisplayItalic: 'Fraunces_400Regular',
  enDisplayBold: 'Fraunces_700Bold',
  body: 'Mukta_400Regular',
  bodyLight: 'Mukta_300Light',
  bodyMedium: 'Mukta_500Medium',
  bodySemi: 'Mukta_600SemiBold',
  bodyBold: 'Mukta_700Bold',
  // System monospace fallback for vault hashes / GPS metadata.
  mono: 'monospace',
} as const;

export const colors = {
  // ── Editorial Bharat (Saheli core) ───────────────
  cream: '#fefae0',
  creamSoft: '#f5e9d3',
  indigo: '#1c2454',
  indigoSoft: '#2c3a7a',
  inkTeal: '#0e3b3c',
  taupe: '#7a6f47',
  sindoor: '#c5443c',
  sindoorSoft: '#e09c97',

  // ── Aliases for existing imports ─────────────────
  bg: '#fefae0',              // was navy; now cream
  bgDeep: '#f5e9d3',          // was deeper navy; now cream-soft
  text: '#0e3b3c',            // was cream; now ink teal on cream bg
  textMuted: '#7a6f47',       // was muted cream; now taupe
  card: '#fefae0',            // was deep navy card; now cream
  cardSoft: '#f5e9d3',        // was deeper card; now creamSoft
  border: 'rgba(28, 36, 84, 0.15)',  // indigo at low opacity
  borderStrong: 'rgba(28, 36, 84, 0.3)',
  saffron: '#c5443c',         // legacy alias → sindoor (distress only)
  saffronDeep: '#1c2454',     // legacy alias → indigo
  saffronMuted: '#1c2454',    // legacy alias → indigo
  crimson: '#c5443c',
  crimsonBright: '#c5443c',
  green: '#1c2454',           // success uses indigo, not green
  white: '#fefae0',           // pure white forbidden — use cream
  black: '#1c2454',           // pure black forbidden — use indigo
  danger: '#c5443c',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontFamily: fonts.hiDisplay, fontSize: 36, lineHeight: 48, color: colors.indigo },
  h1: { fontFamily: fonts.hiDisplay, fontSize: 28, lineHeight: 40, color: colors.indigo },
  h2: { fontFamily: fonts.hiDisplay, fontSize: 22, lineHeight: 32, color: colors.indigo },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.inkTeal },
  bodyHi: { fontFamily: fonts.hiDisplay, fontSize: 17, lineHeight: 26, color: colors.indigo },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: colors.taupe },
  micro: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.taupe },
  devanagari: { fontFamily: fonts.hiDisplay, fontSize: 22, lineHeight: 32, color: colors.indigo },
};
