"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Single-series chart: one honey hue (validated ≥3:1 on the white card), thin 2px line,
// recessive grid, crosshair tooltip. Values are paisa; displayed as rupees.
const HONEY = "#C97F06";

const rupees = (paisa: number) => `Rs ${Math.round(paisa / 100).toLocaleString("en-PK")}`;
const compact = (paisa: number) => {
  const r = paisa / 100;
  if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(1)}M`;
  if (r >= 1_000) return `${Math.round(r / 1_000)}k`;
  return String(Math.round(r));
};
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short" });

export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Daily revenue chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={HONEY} stopOpacity={0.28} />
              <stop offset="1" stopColor={HONEY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E9DDC7" strokeDasharray="3 4" />
          <XAxis dataKey="date" tickFormatter={day} tick={{ fontSize: 11, fill: "#8A7862" }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: "#8A7862" }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ stroke: "#8A7862", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]!.payload as { date: string; revenue: number; orders: number };
              return (
                <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-card">
                  <b className="block text-foreground">{day(p.date)}</b>
                  <span className="text-ink-2">
                    {rupees(p.revenue)} · {p.orders} order{p.orders === 1 ? "" : "s"}
                  </span>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="revenue" stroke={HONEY} strokeWidth={2} fill="url(#revFill)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
