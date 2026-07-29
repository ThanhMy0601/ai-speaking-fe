import type { Topic } from "../types/domain";
import { cx } from "../lib/cx";

interface Props {
  topic: Topic;
  onSelect: (topic: Topic) => void;
}

export default function TopicCard({ topic, onSelect }: Props) {
  const done = topic.completed;

  return (
    <button
      onClick={() => onSelect(topic)}
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-lg border text-left",
        "transition-[transform,border-color] duration-(--duration-base) ease-(--ease-out-expo)",
        "hover:-translate-y-1 focus-visible:-translate-y-1",
        done ? "border-[rgb(74_222_128/0.28)]" : "border-border hover:border-border-strong"
      )}
    >
      {/* Banner tinted by the topic's own gradient, which the API supplies.
          Kept low-opacity so ten different hues still read as one system
          rather than a bag of sweets. */}
      <div className="relative h-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-70 transition-opacity duration-(--duration-base) group-hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${topic.gradient_from}, ${topic.gradient_to})`,
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[rgb(11_16_32/0.85)] to-transparent" />

        <span
          className="absolute top-3 left-4 text-2xl drop-shadow-[0_2px_8px_rgb(0_0_0/0.5)]"
          aria-hidden
        >
          {topic.icon}
        </span>
        <span
          className="absolute right-4 bottom-2 text-4xl font-bold text-white/15 tabular-nums"
          aria-hidden
        >
          {String(topic.sequence_order).padStart(2, "0")}
        </span>

        {done && (
          <span className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-[rgb(74_222_128/0.9)] text-xs text-[#04140a]">
            ✓
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 bg-surface-glass p-4 backdrop-blur-xl">
        <h3 className="font-semibold text-ink">{topic.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-ink-muted">{topic.description}</p>

        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
          <span className="text-ink-subtle tabular-nums">
            {topic.estimated_minutes} min
            {topic.level_count > 1 && ` · ${topic.level_count} levels`}
          </span>

          {done ? (
            <span className="font-medium text-success">
              Practised {topic.attempt_count}×
            </span>
          ) : (
            <span className="font-medium text-accent-soft opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100">
              Start →
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
