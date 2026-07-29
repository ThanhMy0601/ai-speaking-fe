interface Props {
  value: number;
  max?: number;
  label?: string;
}

export default function ProgressBar({ value, max = 100, label }: Props) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-white/8"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-accent to-accent-to transition-[width] duration-(--duration-slower) ease-(--ease-out-expo)"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
