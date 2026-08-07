import { useState } from "react";
import Button from "../ui/Button";

interface Props {
  label: string;
  placeholder?: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
}

/**
 * Tag editor for the plain string arrays — target_grammar today.
 *
 * These steer the tutor and are never shown to a learner, so unlike
 * target_vocabulary they carry no translation and stay a flat string[].
 */
export default function StringListEditor({
  label,
  placeholder,
  hint,
  items,
  onChange,
}: Props) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (!items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      onChange([...items, value]);
    }
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-ink-subtle tabular-nums">{items.length}</span>
      </div>
      {hint && <p className="text-xs text-ink-subtle">{hint}</p>}

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-glass py-1 pr-1 pl-3 text-sm text-ink"
            >
              {item}
              <button
                type="button"
                aria-label={`Xoá ${item}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="rounded-full px-1 text-ink-subtle transition-colors hover:text-ink"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          aria-label={label}
          className="min-w-0 flex-1 rounded-sm border border-border bg-surface-base px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-subtle focus-visible:border-border-focus"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Without this, Enter submits the surrounding topic form.
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          Thêm
        </Button>
      </div>
    </div>
  );
}
