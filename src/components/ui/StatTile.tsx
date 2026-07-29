import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
}

/** Tabular numerals so a changing value doesn't shift the layout. */
export default function StatTile({ label, value, hint }: Props) {
  return (
    <div className="rounded-md border border-border bg-surface-glass p-4">
      <div className="text-xs font-medium tracking-wide text-ink-subtle uppercase">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold text-ink tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-subtle">{hint}</div>}
    </div>
  );
}
