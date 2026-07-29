import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "../../lib/cx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export default function Input({ label, hint, error, className, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          "h-11 rounded-md border bg-[rgb(0_0_0/0.25)] px-3.5 text-base text-ink",
          "placeholder:text-ink-subtle transition-colors duration-(--duration-fast)",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(109_94_248/0.45)]",
          error
            ? "border-danger focus:border-danger"
            : "border-border focus:border-border-focus",
          className
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
