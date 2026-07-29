import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-glass text-ink-muted border-border",
  accent: "bg-[rgb(109_94_248/0.16)] text-accent-soft border-[rgb(109_94_248/0.3)]",
  success: "bg-success-dim text-success border-[rgb(74_222_128/0.28)]",
  warning: "bg-warning-dim text-warning border-[rgb(251_191_36/0.28)]",
  danger: "bg-danger-dim text-danger border-[rgb(248_113_113/0.28)]",
  info: "bg-info-dim text-info border-[rgb(56_189_248/0.28)]",
};

export default function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
