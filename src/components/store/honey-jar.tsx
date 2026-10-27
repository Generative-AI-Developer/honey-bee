import { useId } from "react";

// Decorative honey-jar illustration used in the hero and empty states.
const TONES = {
  sidr: ["#E9A21A", "#9C4E06"],
  acacia: ["#F6CF5A", "#C98B10"],
  forest: ["#B4560F", "#5A2604"],
  kalonji: ["#8A3E0B", "#3D1803"],
} as const;

export function HoneyJar({ tone = "sidr", label, className, lid = "#3B2A1A" }: { tone?: keyof typeof TONES; label: string; className?: string; lid?: string }) {
  const id = useId().replace(/:/g, "");
  const [a, b] = TONES[tone];
  return (
    <svg viewBox="0 0 160 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="192" rx="56" ry="6" fill="#000" opacity=".12" />
      <path d="M34 54 Q30 60 30 72 V170 Q30 188 50 188 H110 Q130 188 130 170 V72 Q130 60 126 54 Z" fill={`url(#g${id})`} />
      <path d="M34 54 Q30 60 30 72 V170 Q30 188 50 188 H110 Q130 188 130 170 V72 Q130 60 126 54 Z" fill={`url(#s${id})`} />
      <rect x="38" y="26" width="84" height="30" rx="6" fill={lid} />
      <rect x="38" y="44" width="84" height="5" fill="#000" opacity=".18" />
      <rect x="42" y="96" width="76" height="56" rx="6" fill="#FFF8EA" />
      <path d="M80 104 l6 3.5 v7 l-6 3.5 -6-3.5 v-7z" fill="none" stroke={b} strokeWidth="1.6" />
      <text x="80" y="132" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="11" fill="#3B2A1A" letterSpacing="1">
        {label}
      </text>
      <text x="80" y="144" textAnchor="middle" fontFamily="sans-serif" fontSize="6.5" fill="#7a6650" letterSpacing="1.5">
        RAW · PURE
      </text>
    </svg>
  );
}
