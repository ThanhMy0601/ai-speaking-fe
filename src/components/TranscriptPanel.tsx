import { useEffect, useRef } from "react";
import type { TranscriptMessage } from "../types/domain";
import { cx } from "../lib/cx";

interface Props {
  messages: TranscriptMessage[];
}

export default function TranscriptPanel({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="flex h-full flex-col gap-3 overflow-y-auto p-4"
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
    >
      {messages.length === 0 && (
        <p className="m-auto max-w-xs text-center text-sm text-ink-subtle">
          Your conversation will appear here as you speak.
        </p>
      )}

      {messages.map((msg) => {
        const mine = msg.speaker === "learner";
        return (
          <div
            key={msg.sequence}
            className={cx("flex flex-col gap-1", mine ? "items-end" : "items-start")}
          >
            <span className="px-1 text-2xs font-medium tracking-wide text-ink-subtle uppercase">
              {mine ? "You" : "Tutor"}
            </span>
            <div
              className={cx(
                "max-w-[85%] rounded-md border px-3.5 py-2.5 text-sm",
                mine
                  ? "border-[rgb(109_94_248/0.3)] bg-[rgb(109_94_248/0.14)] text-ink"
                  : "border-border bg-surface-glass text-ink-muted"
              )}
            >
              {msg.text}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
