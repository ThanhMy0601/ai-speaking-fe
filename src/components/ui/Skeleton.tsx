import { cx } from "../../lib/cx";

/** Placeholder block. Beats the literal word "Loading..." the app used to show. */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("rounded-md bg-white/6", className)}
      style={{ animation: "pulse 1.6s var(--ease-out-expo) infinite" }}
    >
      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}"}</style>
    </div>
  );
}
