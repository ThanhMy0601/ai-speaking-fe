import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/cx";
import Spinner from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-[transform,background-color,box-shadow,opacity] duration-(--duration-base) " +
  "ease-(--ease-out-expo) active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  // The one gradient in the system, reserved for the single most important
  // action on a screen. Everything else is a surface.
  primary:
    "text-accent-ink bg-linear-135 from-accent to-accent-to " +
    "shadow-[var(--glow-accent)] hover:brightness-110",
  secondary:
    "bg-surface-glass text-ink border border-border hover:bg-surface-hover " +
    "hover:border-border-strong",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-glass",
  danger:
    "bg-danger-dim text-danger border border-[rgb(248_113_113/0.3)] " +
    "hover:bg-[rgb(248_113_113/0.2)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={cx(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {/* Label stays in flow while loading so the button doesn't resize
          mid-click and shift whatever is next to it. */}
      <span className={cx("contents", loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={size === "lg" ? 20 : 16} />
        </span>
      )}
    </button>
  );
}
