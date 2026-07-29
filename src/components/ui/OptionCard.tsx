import { cx } from "../../lib/cx";

interface Props {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
  required?: boolean;
}

/**
 * A radio rendered as a selectable card.
 *
 * The native input stays in the DOM (sr-only) rather than being replaced by
 * a div, so keyboard navigation, form submission and screen readers all keep
 * working — the old markup styled `.radio-card` but never showed selection
 * state, because the rules for it were written and the JSX rendered bare
 * spans.
 */
export default function OptionCard({
  name,
  value,
  checked,
  onChange,
  label,
  hint,
  required,
}: Props) {
  return (
    <label
      className={cx(
        "group relative flex cursor-pointer items-start gap-3 rounded-md border p-4",
        "transition-[border-color,background-color] duration-(--duration-base)",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[rgb(109_94_248/0.45)]",
        checked
          ? "border-accent bg-[rgb(109_94_248/0.12)]"
          : "border-border bg-surface-glass hover:border-border-strong hover:bg-surface-hover"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="sr-only"
      />

      <span
        aria-hidden
        className={cx(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          checked ? "border-accent" : "border-border-strong"
        )}
      >
        <span
          className={cx(
            "size-2.5 rounded-full bg-accent transition-transform duration-(--duration-base) ease-(--ease-spring)",
            checked ? "scale-100" : "scale-0"
          )}
        />
      </span>

      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </span>
    </label>
  );
}
