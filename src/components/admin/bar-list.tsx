// Labelled horizontal bars in one hue (--chart-1): the label and value carry identity, never colour alone.
export function BarList({ rows, format }: { rows: { label: string; value: number; display?: string }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${r.display ?? format?.(r.value) ?? r.value}`}>
          <span className="truncate text-foreground-soft">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <b className="min-w-16 text-right tabular-nums">
            {r.display ?? format?.(r.value) ?? r.value}
            {total > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{Math.round((r.value / total) * 100)}%</span>}
          </b>
        </li>
      ))}
    </ul>
  );
}
