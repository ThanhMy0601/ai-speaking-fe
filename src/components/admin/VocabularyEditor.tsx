import { useState } from "react";
import type { TopicVocabularyItem } from "../../types/domain";
import Button from "../ui/Button";

interface Props {
  items: TopicVocabularyItem[];
  onChange: (items: TopicVocabularyItem[]) => void;
}

/**
 * Editor for a topic's word list.
 *
 * Two fields per row rather than a tag input, because each entry carries a
 * Vietnamese gloss the learner reads. The gloss is optional — the reshape
 * migration left older rows null and a topic is still usable without one —
 * so an empty meaning is saved as null rather than "".
 */
export default function VocabularyEditor({ items, onChange }: Props) {
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");

  const add = () => {
    const t = term.trim();
    if (!t) return;
    // Case-insensitive: "Catch Up" and "catch up" are the same entry, and a
    // duplicate would show up twice in the learner's dialog.
    if (items.some((i) => i.term.toLowerCase() === t.toLowerCase())) {
      setTerm("");
      setMeaning("");
      return;
    }
    onChange([...items, { term: t, meaning_vi: meaning.trim() || null }]);
    setTerm("");
    setMeaning("");
  };

  const patch = (index: number, next: Partial<TopicVocabularyItem>) => {
    onChange(
      items.map((item, i) =>
        i === index
          ? {
              term: next.term ?? item.term,
              meaning_vi:
                next.meaning_vi !== undefined
                  ? next.meaning_vi || null
                  : item.meaning_vi,
            }
          : item
      )
    );
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const cell =
    "min-w-0 rounded-sm border border-border bg-surface-base px-2.5 py-1.5 text-sm text-ink " +
    "placeholder:text-ink-subtle focus-visible:border-border-focus";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">Từ vựng</span>
        <span className="text-xs text-ink-subtle tabular-nums">{items.length} từ</span>
      </div>

      {items.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="grid grid-cols-[1.25rem_1fr_1fr_auto] items-center gap-2">
              <span className="text-xs text-ink-subtle tabular-nums">{i + 1}</span>

              <input
                aria-label={`Từ thứ ${i + 1}`}
                className={cell}
                value={item.term}
                onChange={(e) => patch(i, { term: e.target.value })}
              />
              <input
                aria-label={`Nghĩa tiếng Việt của từ thứ ${i + 1}`}
                className={cell}
                placeholder="nghĩa tiếng Việt"
                value={item.meaning_vi ?? ""}
                onChange={(e) => patch(i, { meaning_vi: e.target.value })}
              />

              <span className="flex items-center gap-0.5">
                <IconButton label="Lên" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </IconButton>
                <IconButton
                  label="Xuống"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                >
                  ↓
                </IconButton>
                <IconButton
                  label={`Xoá ${item.term}`}
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  ✕
                </IconButton>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <input
          aria-label="Từ hoặc cụm từ mới"
          className={cell}
          placeholder="từ / cụm từ"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Otherwise Enter submits the whole topic form.
              e.preventDefault();
              add();
            }
          }}
        />
        <input
          aria-label="Nghĩa tiếng Việt"
          className={cell}
          placeholder="nghĩa tiếng Việt"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
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

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-xs px-1.5 py-1 text-sm text-ink-subtle transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-subtle"
    >
      {children}
    </button>
  );
}
