"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeInterval, fromIntervalSeconds, toIntervalSeconds, type IntervalUnit } from "@/lib/interval";

/** Number + Seconds/Minutes, e.g. "30 seconds" or "2 minutes". Saves the value in seconds. */
export function IntervalInput({ label, seconds, disabled, onSave }: { label: string; seconds: number; disabled?: boolean; onSave: (seconds: number) => void }) {
  const initial = fromIntervalSeconds(seconds);
  const [value, setValue] = useState(initial.value);
  const [unit, setUnit] = useState<IntervalUnit>(initial.unit);
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  return (
    <form
      className="grid gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const res = toIntervalSeconds(value, unit);
        if ("error" in res) return setError(res.error);
        setError(null);
        onSave(res.seconds);
      }}
    >
      <label htmlFor={`${id}-n`} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={`${id}-n`}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
          className="w-24"
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint`}
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as IntervalUnit)}
          aria-label={`${label}: unit`}
          className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm"
        >
          <option value="seconds">Seconds</option>
          <option value="minutes">Minutes</option>
        </select>
        <Button type="submit" variant="subtle" disabled={disabled}>
          Save
        </Button>
      </div>
      <p id={`${id}-hint`} className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
        {error ?? `Currently every ${describeInterval(seconds)}. Any value from 2 seconds to 60 minutes.`}
      </p>
    </form>
  );
}
