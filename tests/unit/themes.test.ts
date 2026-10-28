import { describe, expect, it } from "vitest";
import { COLOR_MODES, DEFAULT_THEME, THEME_CSS, THEME_IDS, THEMES, type Palette } from "@/lib/themes";

// WCAG 2.x relative-luminance contrast.
function luminance(hex: string) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
}

type Pair = [fg: keyof Palette, bg: keyof Palette, min: number];

// Text pairs need 4.5:1 (WCAG AA). Non-text UI (focus ring, chart marks) needs 3:1.
const PAIRS: Pair[] = [
  ["foreground", "background", 4.5],
  ["foreground", "card", 4.5],
  ["foreground", "muted", 4.5],
  ["foreground-soft", "background", 4.5],
  ["foreground-soft", "card", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["card-foreground", "card", 4.5],
  ["popover-foreground", "popover", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["primary-strong", "background", 4.5],
  ["primary-strong", "card", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["accent-foreground", "accent", 4.5],
  ["inverse-foreground", "inverse", 4.5],
  ["chrome-foreground", "chrome", 4.5],
  ["chrome-muted", "chrome", 4.5],
  ["chrome-accent", "chrome", 4.5],
  ["destructive", "card", 4.5],
  ["destructive", "destructive-soft", 4.5],
  ["success", "card", 4.5],
  ["success", "success-soft", 4.5],
  ["warning", "warning-soft", 4.5],
  ["info", "info-soft", 4.5],
  ["processing", "processing-soft", 4.5],
  ["ring", "background", 3],
  ["ring", "card", 3],
  ["chart-1", "card", 3],
  ["rating", "card", 2], // decorative; the numeric rating and aria-label carry the value
];

describe("theme config", () => {
  it("has exactly three themes, each with light and dark palettes", () => {
    expect(THEME_IDS).toEqual(["golden", "indigo", "midnight"]);
    for (const id of THEME_IDS) for (const mode of COLOR_MODES) expect(THEMES[id][mode]).toBeTruthy();
  });

  it("defaults to Golden light", () => expect(DEFAULT_THEME).toEqual({ theme: "golden", mode: "light" }));

  it("every palette defines the same tokens", () => {
    const keys = Object.keys(THEMES.golden.light).sort();
    for (const id of THEME_IDS) for (const mode of COLOR_MODES) expect(Object.keys(THEMES[id][mode]).sort()).toEqual(keys);
  });

  it("emits a CSS block per theme and mode", () => {
    for (const id of THEME_IDS) for (const mode of COLOR_MODES) expect(THEME_CSS).toContain(`[data-theme="${id}"][data-mode="${mode}"]`);
  });

  it("keeps the requested brand colours", () => {
    expect(THEMES.golden.light.background).toBe("#FAF8F1");
    expect(THEMES.golden.dark.background).toBe("#17140D");
    expect(THEMES.golden.dark.card).toBe("#292318");
    expect(THEMES.indigo.light.background).toBe("#F8FAFC");
    expect(THEMES.indigo.dark.background).toBe("#0F1024");
    expect(THEMES.indigo.dark.card).toBe("#1C1D3A");
    expect(THEMES.midnight.light.background).toBe("#F1F5F9");
    expect(THEMES.midnight.dark.background).toBe("#0B1220");
    expect(THEMES.midnight.dark.card).toBe("#172554");
  });

  for (const id of THEME_IDS) {
    for (const mode of COLOR_MODES) {
      describe(`${id} ${mode} contrast`, () => {
        const p = THEMES[id][mode];
        for (const [fg, bg, min] of PAIRS) {
          it(`${fg} on ${bg} ≥ ${min}:1`, () => {
            expect(contrast(p[fg], p[bg]), `${p[fg]} on ${p[bg]}`).toBeGreaterThanOrEqual(min);
          });
        }
      });
    }
  }
});
