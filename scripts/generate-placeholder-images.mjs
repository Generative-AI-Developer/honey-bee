// Generates the placeholder honey-jar product images in public/images/products/.
// Replace them with real product photos via Admin → Products (or Cloudinary).
// Usage: node scripts/generate-placeholder-images.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const out = path.join(process.cwd(), "public", "images", "products");

const jars = {
  sidr: { label: "SIDR", a: "#E9A21A", b: "#9C4E06", bg: "#F8E3B8" },
  "sidr-royal": { label: "ROYAL", a: "#D8860F", b: "#7A3A05", bg: "#F3DDB6" },
  acacia: { label: "ACACIA", a: "#F6CF5A", b: "#C98B10", bg: "#FBF0CF" },
  forest: { label: "FOREST", a: "#B4560F", b: "#5A2604", bg: "#EED8C0" },
  kalonji: { label: "KALONJI", a: "#8A3E0B", b: "#3D1803", bg: "#ECD7C4" },
  orange: { label: "ORANGE", a: "#F3B33A", b: "#B9680A", bg: "#FCE7C4" },
  comb: { label: "COMB", a: "#F0B428", b: "#A8620A", bg: "#FAE6B4" },
  multiflora: { label: "MULTI", a: "#F2BE45", b: "#B5720B", bg: "#FBEFD2" },
  ajwain: { label: "AJWAIN", a: "#C7731A", b: "#6E3507", bg: "#F1DDC4" },
  shahad: { label: "SHAHAD", a: "#E59A1F", b: "#8A4407", bg: "#F6E0BC" },
  gift: { label: "GIFT", a: "#E8A01E", b: "#94500A", bg: "#F6E2C1" },
  "gift-trio": { label: "TRIO", a: "#D99018", b: "#874509", bg: "#F3DEC0" },
};

function jarSvg({ label, a, b, bg }, variant = 0) {
  const tilt = variant === 1 ? "rotate(-6 400 420)" : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <pattern id="c" width="56" height="98" patternUnits="userSpaceOnUse"><path d="M28 66 0 50V18L28 2l28 16v32L28 66zm0 32L0 82" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/></pattern>
  </defs>
  <rect width="800" height="800" fill="${bg}"/>
  <rect width="800" height="800" fill="url(#c)"/>
  ${variant === 2 ? `<circle cx="400" cy="400" r="260" fill="${a}" opacity=".35"/>` : ""}
  <g transform="translate(240 150) ${tilt}">
    <ellipse cx="160" cy="492" rx="130" ry="14" fill="#000" opacity=".14"/>
    <path d="M68 128 Q60 140 60 168 V430 Q60 476 104 476 H216 Q260 476 260 430 V168 Q260 140 252 128 Z" fill="url(#h)"/>
    <path d="M68 128 Q60 140 60 168 V430 Q60 476 104 476 H216 Q260 476 260 430 V168 Q260 140 252 128 Z" fill="url(#s)"/>
    <rect x="76" y="62" width="168" height="70" rx="12" fill="#3B2A1A"/>
    <rect x="76" y="104" width="168" height="10" fill="#000" opacity=".18"/>
    <rect x="86" y="236" width="148" height="128" rx="12" fill="#FFF8EA"/>
    <path d="M160 254 l13 7.5 v15 l-13 7.5 -13-7.5 v-15z" fill="none" stroke="${b}" stroke-width="3"/>
    <text x="160" y="320" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${label.length > 6 ? 22 : 26}" fill="#3B2A1A" letter-spacing="2">${label}</text>
    <text x="160" y="346" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#7a6650" letter-spacing="3">RAW · PURE</text>
  </g>
</svg>`;
}

await mkdir(out, { recursive: true });
for (const [name, spec] of Object.entries(jars)) {
  for (const v of [0, 1, 2]) {
    await writeFile(path.join(out, `${name}${v ? `-${v + 1}` : ""}.svg`), jarSvg(spec, v));
  }
}
console.log(`Wrote ${Object.keys(jars).length * 3} images to ${out}`);
