// Single source of truth for the site's colour schemes.
// Three themes × light/dark. Every value is a semantic token consumed through CSS variables
// (see globals.css @theme), so components never hard-code colours.
// Contrast for every palette is enforced by tests/unit/themes.test.ts.

export const THEME_IDS = ["golden", "indigo", "midnight"] as const;
export const COLOR_MODES = ["light", "dark"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export type ColorMode = (typeof COLOR_MODES)[number];

export const DEFAULT_THEME: { theme: ThemeId; mode: ColorMode } = { theme: "golden", mode: "light" };

export type Palette = {
  background: string;
  foreground: string;
  "foreground-soft": string; // secondary body text
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string; // brand fill (buttons, highlights)
  "primary-foreground": string;
  "primary-strong": string; // brand-coloured text, links and icons on background/card
  secondary: string;
  "secondary-foreground": string;
  muted: string; // subtle section / placeholder surface
  "muted-foreground": string;
  accent: string; // soft brand tint (selected, hover, pills)
  "accent-foreground": string;
  destructive: string;
  "destructive-soft": string;
  success: string;
  "success-soft": string;
  warning: string;
  "warning-soft": string;
  info: string;
  "info-soft": string;
  processing: string;
  "processing-soft": string;
  border: string;
  input: string;
  ring: string;
  chrome: string; // dark bands: announcement bar, footer, admin sidebar, promo
  "chrome-foreground": string;
  "chrome-muted": string;
  "chrome-border": string;
  "chrome-hover": string;
  "chrome-accent": string;
  header: string; // storefront top bar (logo, menu, search, cart)
  "header-foreground": string;
  "header-accent": string; // brand text on the header ("Bee" in the logo)
  "header-hover": string;
  "header-border": string;
  inverse: string; // strongest-contrast fill: dark buttons, active chips
  "inverse-foreground": string;
  rating: string;
  "rating-empty": string;
  "hero-from": string;
  "hero-to": string;
  "hero-glow": string;
  "chart-1": string;
  "chart-2": string;
  "chart-3": string;
  "chart-4": string;
  "chart-5": string;
  "chart-grid": string;
  "shadow-color": string; // "r g b"
};

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;
  /** Spec colours shown on the admin preview cards. */
  swatches: { primary: string; secondary: string; lightBackground: string; lightSurface: string; darkBackground: string; darkSurface: string; text: string };
  light: Palette;
  dark: Palette;
};

const lightStatus = {
  destructive: "#B42318",
  "destructive-soft": "#FDECEA",
  success: "#2B6B35",
  "success-soft": "#E3F2E5",
  warning: "#8A5300",
  "warning-soft": "#FCF0CF",
  info: "#1D4E8F",
  "info-soft": "#E2ECF8",
  processing: "#6B3589",
  "processing-soft": "#F2E7F8",
};

const darkStatus = {
  destructive: "#F87171",
  "destructive-soft": "#3A1717",
  success: "#6CCF88",
  "success-soft": "#13301C",
  warning: "#F2C14E",
  "warning-soft": "#3A2E0C",
  info: "#7DB3F5",
  "info-soft": "#142A46",
  processing: "#D2A6F0",
  "processing-soft": "#2E1C3C",
};

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  golden: {
    id: "golden",
    name: "Golden / Champagne",
    description: "Warm honey gold on champagne cream. The original Honey Bee look.",
    swatches: { primary: "#C9A227", secondary: "#E7D7A0", lightBackground: "#FAF8F1", lightSurface: "#FFFFFF", darkBackground: "#17140D", darkSurface: "#292318", text: "#292524" },
    light: {
      background: "#FAF8F1",
      foreground: "#292524",
      "foreground-soft": "#57514A",
      card: "#FFFFFF",
      "card-foreground": "#292524",
      popover: "#FFFFFF",
      "popover-foreground": "#292524",
      primary: "#C9A227",
      "primary-foreground": "#1C1917",
      "primary-strong": "#82640D",
      secondary: "#E7D7A0",
      "secondary-foreground": "#292524",
      muted: "#F2EDDD",
      "muted-foreground": "#6A6255",
      accent: "#F6EDCC",
      "accent-foreground": "#292524",
      ...lightStatus,
      border: "#E6DFCB",
      input: "#CDC3A8",
      ring: "#A4820F",
      chrome: "#292524",
      "chrome-foreground": "#FAF8F1",
      "chrome-muted": "#D0C9BC",
      "chrome-border": "#46403A",
      "chrome-hover": "#3A3530",
      "chrome-accent": "#D9B640",
      header: "#FCAE05",
      "header-foreground": "#1C1917",
      "header-accent": "#5C3D00",
      "header-hover": "#EBA000",
      "header-border": "#E09B04",
      inverse: "#292524",
      "inverse-foreground": "#FFFFFF",
      rating: "#C9A227",
      "rating-empty": "#E4DCC6",
      "hero-from": "#EBD27A",
      "hero-to": "#C9A227",
      "hero-glow": "#F1E4B8",
      "chart-1": "#A4820F",
      "chart-2": "#6A6255",
      "chart-3": "#2B6B35",
      "chart-4": "#292524",
      "chart-5": "#B42318",
      "chart-grid": "#E6DFCB",
      "shadow-color": "41 37 36",
    },
    dark: {
      background: "#17140D",
      foreground: "#F3EEE2",
      "foreground-soft": "#D7CFBE",
      card: "#292318",
      "card-foreground": "#F3EEE2",
      popover: "#2F281C",
      "popover-foreground": "#F3EEE2",
      primary: "#D4AF37",
      "primary-foreground": "#17140D",
      "primary-strong": "#E3C25A",
      secondary: "#E7D7A0",
      "secondary-foreground": "#17140D",
      muted: "#211C12",
      "muted-foreground": "#B3A992",
      accent: "#3C3320",
      "accent-foreground": "#F3EEE2",
      ...darkStatus,
      border: "#3B3324",
      input: "#625640",
      ring: "#E3C25A",
      chrome: "#0F0D08",
      "chrome-foreground": "#F3EEE2",
      "chrome-muted": "#B3A992",
      "chrome-border": "#2E281C",
      "chrome-hover": "#221D14",
      "chrome-accent": "#E3C25A",
      header: "#FCAE05",
      "header-foreground": "#1C1917",
      "header-accent": "#5C3D00",
      "header-hover": "#EBA000",
      "header-border": "#E09B04",
      inverse: "#F3EEE2",
      "inverse-foreground": "#17140D",
      rating: "#E3C25A",
      "rating-empty": "#4A4130",
      "hero-from": "#E3C25A",
      "hero-to": "#9C7A12",
      "hero-glow": "#2F2715",
      "chart-1": "#E3C25A",
      "chart-2": "#B3A992",
      "chart-3": "#6CCF88",
      "chart-4": "#F3EEE2",
      "chart-5": "#F87171",
      "chart-grid": "#3B3324",
      "shadow-color": "0 0 0",
    },
  },
  indigo: {
    id: "indigo",
    name: "Indigo / Violet",
    description: "Modern indigo with soft violet accents on cool slate.",
    swatches: { primary: "#6366F1", secondary: "#818CF8", lightBackground: "#F8FAFC", lightSurface: "#FFFFFF", darkBackground: "#0F1024", darkSurface: "#1C1D3A", text: "#1E293B" },
    light: {
      background: "#F8FAFC",
      foreground: "#1E293B",
      "foreground-soft": "#3F4A5C",
      card: "#FFFFFF",
      "card-foreground": "#1E293B",
      popover: "#FFFFFF",
      "popover-foreground": "#1E293B",
      primary: "#5B5FEF",
      "primary-foreground": "#FFFFFF",
      "primary-strong": "#4F46E5",
      secondary: "#818CF8",
      "secondary-foreground": "#0F1024",
      muted: "#EEF1F7",
      "muted-foreground": "#55607A",
      accent: "#EEF0FF",
      "accent-foreground": "#1E1B4B",
      ...lightStatus,
      border: "#E2E8F0",
      input: "#C3CCDB",
      ring: "#6366F1",
      chrome: "#1E1B4B",
      "chrome-foreground": "#EEF2FF",
      "chrome-muted": "#C7D0F5",
      "chrome-border": "#35317A",
      "chrome-hover": "#2B2766",
      "chrome-accent": "#A5B4FC",
      header: "#FCAE05",
      "header-foreground": "#1C1917",
      "header-accent": "#312E81",
      "header-hover": "#EBA000",
      "header-border": "#E09B04",
      inverse: "#1E293B",
      "inverse-foreground": "#FFFFFF",
      rating: "#D98E04",
      "rating-empty": "#E2E8F0",
      "hero-from": "#A5B4FC",
      "hero-to": "#6366F1",
      "hero-glow": "#E0E7FF",
      "chart-1": "#6366F1",
      "chart-2": "#55607A",
      "chart-3": "#2B6B35",
      "chart-4": "#1E293B",
      "chart-5": "#B42318",
      "chart-grid": "#E2E8F0",
      "shadow-color": "30 41 59",
    },
    dark: {
      background: "#0F1024",
      foreground: "#E7E9FB",
      "foreground-soft": "#C8CBE8",
      card: "#1C1D3A",
      "card-foreground": "#E7E9FB",
      popover: "#232447",
      "popover-foreground": "#E7E9FB",
      primary: "#818CF8",
      "primary-foreground": "#0F1024",
      "primary-strong": "#A5B4FC",
      secondary: "#818CF8",
      "secondary-foreground": "#0F1024",
      muted: "#16172F",
      "muted-foreground": "#A2A7C8",
      accent: "#2A2C5C",
      "accent-foreground": "#E7E9FB",
      ...darkStatus,
      border: "#2C2E58",
      input: "#4A4D82",
      ring: "#A5B4FC",
      chrome: "#0A0B1A",
      "chrome-foreground": "#E7E9FB",
      "chrome-muted": "#A2A7C8",
      "chrome-border": "#24264A",
      "chrome-hover": "#17183A",
      "chrome-accent": "#A5B4FC",
      header: "#FCAE05",
      "header-foreground": "#1C1917",
      "header-accent": "#312E81",
      "header-hover": "#EBA000",
      "header-border": "#E09B04",
      inverse: "#E7E9FB",
      "inverse-foreground": "#0F1024",
      rating: "#FBBF24",
      "rating-empty": "#34365F",
      "hero-from": "#A5B4FC",
      "hero-to": "#4F46E5",
      "hero-glow": "#1B1C40",
      "chart-1": "#A5B4FC",
      "chart-2": "#A2A7C8",
      "chart-3": "#6CCF88",
      "chart-4": "#E7E9FB",
      "chart-5": "#F87171",
      "chart-grid": "#2C2E58",
      "shadow-color": "0 0 0",
    },
  },
  midnight: {
    id: "midnight",
    name: "Midnight / Electric Blue",
    description: "Crisp electric blue with deep midnight navy.",
    swatches: { primary: "#3B82F6", secondary: "#60A5FA", lightBackground: "#F1F5F9", lightSurface: "#FFFFFF", darkBackground: "#0B1220", darkSurface: "#172554", text: "#1E293B" },
    light: {
      background: "#F1F5F9",
      foreground: "#1E293B",
      "foreground-soft": "#334155",
      card: "#FFFFFF",
      "card-foreground": "#1E293B",
      popover: "#FFFFFF",
      "popover-foreground": "#1E293B",
      primary: "#2C70E4",
      "primary-foreground": "#FFFFFF",
      "primary-strong": "#1D4ED8",
      secondary: "#60A5FA",
      "secondary-foreground": "#0B1220",
      muted: "#E7EDF4",
      "muted-foreground": "#4F5D72",
      accent: "#DCEAFE",
      "accent-foreground": "#172554",
      ...lightStatus,
      border: "#DCE3EC",
      input: "#BCC7D6",
      ring: "#3B82F6",
      chrome: "#0B1220",
      "chrome-foreground": "#E2E8F0",
      "chrome-muted": "#A7B5CB",
      "chrome-border": "#1F2B47",
      "chrome-hover": "#15203A",
      "chrome-accent": "#60A5FA",
      header: "#FCAE05",
      "header-foreground": "#1C1917",
      "header-accent": "#1E3A8A",
      "header-hover": "#EBA000",
      "header-border": "#E09B04",
      inverse: "#0F172A",
      "inverse-foreground": "#FFFFFF",
      rating: "#D98E04",
      "rating-empty": "#DCE3EC",
      "hero-from": "#93C5FD",
      "hero-to": "#3B82F6",
      "hero-glow": "#DBEAFE",
      "chart-1": "#2563EB",
      "chart-2": "#4F5D72",
      "chart-3": "#2B6B35",
      "chart-4": "#1E293B",
      "chart-5": "#B42318",
      "chart-grid": "#DCE3EC",
      "shadow-color": "15 23 42",
    },
    dark: {
      background: "#0B1220",
      foreground: "#E2E8F0",
      "foreground-soft": "#C5D0DF",
      card: "#172554",
      "card-foreground": "#E2E8F0",
      popover: "#1C2D63",
      "popover-foreground": "#E2E8F0",
      primary: "#60A5FA",
      "primary-foreground": "#0B1220",
      "primary-strong": "#93C5FD",
      secondary: "#60A5FA",
      "secondary-foreground": "#0B1220",
      muted: "#111B31",
      "muted-foreground": "#A3B3CB",
      accent: "#1E3A8A",
      "accent-foreground": "#E2E8F0",
      ...darkStatus,
      "destructive-soft": "#3A1620",
      border: "#24356A",
      input: "#3B5694",
      ring: "#93C5FD",
      chrome: "#070C17",
      "chrome-foreground": "#E2E8F0",
      "chrome-muted": "#A3B3CB",
      "chrome-border": "#1A2440",
      "chrome-hover": "#101A30",
      "chrome-accent": "#93C5FD",
      header: "#FCAE05",
      "header-foreground": "#1C1917",
      "header-accent": "#1E3A8A",
      "header-hover": "#EBA000",
      "header-border": "#E09B04",
      inverse: "#E2E8F0",
      "inverse-foreground": "#0B1220",
      rating: "#FBBF24",
      "rating-empty": "#2A3B6E",
      "hero-from": "#93C5FD",
      "hero-to": "#1D4ED8",
      "hero-glow": "#12204A",
      "chart-1": "#60A5FA",
      "chart-2": "#A3B3CB",
      "chart-3": "#6CCF88",
      "chart-4": "#E2E8F0",
      "chart-5": "#F87171",
      "chart-grid": "#24356A",
      "shadow-color": "0 0 0",
    },
  },
};

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && (THEME_IDS as readonly string[]).includes(v);
}

export function isColorMode(v: unknown): v is ColorMode {
  return v === "light" || v === "dark";
}

/**
 * CSS for all six palettes. Selectors are attribute-based so any element (not only <html>)
 * can host a palette, which the admin preview cards rely on.
 */
export function buildThemeCss(): string {
  const blocks: string[] = [];
  for (const t of Object.values(THEMES)) {
    for (const mode of COLOR_MODES) {
      const vars = Object.entries(t[mode])
        .map(([k, v]) => `--${k}:${v};`)
        .join("");
      const isDefault = t.id === DEFAULT_THEME.theme && mode === DEFAULT_THEME.mode;
      // the default palette also applies when no theme attribute is present (safety fallback)
      const selector = `[data-theme="${t.id}"][data-mode="${mode}"]${isDefault ? ",:root:not([data-theme])" : ""}`;
      blocks.push(`${selector}{${vars}color-scheme:${mode};}`);
    }
  }
  return blocks.join("\n");
}

export const THEME_CSS = buildThemeCss();
