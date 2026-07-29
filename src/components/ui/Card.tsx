import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/cx";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover lift. Only for cards that are actually clickable. */
  interactive?: boolean;
  padded?: boolean;
  children: ReactNode;
}

/**
 * The glass surface everything sits on.
 *
 * Depth in a dark UI comes from the surface getting lighter and a 1px top
 * highlight, not from a drop shadow — a shadow on #0b1020 is invisible.
 */
export default function Card({
  interactive = false,
  padded = true,
  className,
  children,
  ...rest
}: Props) {
  return (
    <div
      className={cx(
        "relative rounded-lg border border-border bg-surface-glass backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px",
        "before:bg-linear-to-r before:from-transparent before:via-white/12 before:to-transparent",
        padded && "p-5",
        interactive &&
          "cursor-pointer transition-[transform,border-color,background-color] " +
            "duration-(--duration-base) ease-(--ease-out-expo) " +
            "hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-hover",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
