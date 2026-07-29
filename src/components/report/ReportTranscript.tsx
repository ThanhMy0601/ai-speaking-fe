import { useMemo } from "react";
import type { TranscriptMessage } from "../../types/domain";
import { formatClock } from "../../hooks/useElapsed";
import { cx } from "../../lib/cx";

interface Props {
  messages: TranscriptMessage[];
  /** Current playback position in ms, or null when there's no audio. */
  positionMs: number | null;
  onSeek?: (ms: number) => void;
}

export default function ReportTranscript({ messages, positionMs, onSeek }: Props) {
  // Offsets exist only once a recording has been made and backfilled from
  // the egress start time. Without them the transcript is still perfectly
  // readable — it just isn't clickable.
  const seekable = onSeek != null && messages.some((m) => m.offset_start_ms != null);

  // The line currently playing is the last one that started at or before
  // the playhead.
  const activeIndex = useMemo(() => {
    if (positionMs == null || !seekable) return -1;
    let found = -1;
    messages.forEach((m, i) => {
      if (m.offset_start_ms != null && m.offset_start_ms <= positionMs) found = i;
    });
    return found;
  }, [messages, positionMs, seekable]);

  if (messages.length === 0) {
    return (
      <p className="rounded-md border border-border bg-surface-glass px-4 py-3.5 text-sm text-ink-muted">
        No transcript was captured for this session.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {messages.map((msg, i) => {
        const mine = msg.speaker === "learner";
        const active = i === activeIndex;
        const offset = msg.offset_start_ms;
        const clickable = seekable && offset != null;

        const body = (
          <>
            <div className="flex items-baseline gap-2">
              <span
                className={cx(
                  "text-2xs font-medium tracking-wide uppercase",
                  mine ? "text-accent-soft" : "text-ink-subtle"
                )}
              >
                {mine ? "You" : "Tutor"}
              </span>
              {offset != null && (
                <span className="text-2xs text-ink-subtle tabular-nums">
                  {formatClock(Math.max(0, Math.floor(offset / 1000)))}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-muted">{msg.text}</p>
          </>
        );

        const shell = cx(
          "w-full rounded-md border px-3.5 py-2.5 text-left transition-colors duration-(--duration-fast)",
          active
            ? "border-accent bg-[rgb(109_94_248/0.14)]"
            : mine
              ? "border-[rgb(109_94_248/0.2)] bg-surface-glass"
              : "border-border bg-surface-glass",
          clickable && "cursor-pointer hover:border-border-strong hover:bg-surface-hover"
        );

        return (
          <li key={msg.sequence}>
            {clickable ? (
              <button
                type="button"
                className={shell}
                onClick={() => onSeek?.(offset)}
                aria-current={active || undefined}
              >
                {body}
              </button>
            ) : (
              <div className={shell}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
