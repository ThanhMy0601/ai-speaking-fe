import { useEffect, useRef } from "react";
import type { TranscriptMessage } from "../types/domain";

interface Props {
  messages: TranscriptMessage[];
}

export default function TranscriptPanel({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="transcript-panel" role="log" aria-label="Conversation transcript">
      {messages.length === 0 && (
        <p className="transcript-empty">Start speaking to begin the conversation...</p>
      )}
      {messages.map((msg) => (
        <div key={msg.sequence} className={`transcript-msg msg-${msg.speaker}`}>
          <span className="msg-speaker">{msg.speaker === "learner" ? "You" : "AI"}</span>
          <p className="msg-text">{msg.text}</p>
          {msg.spoke_started_at && (
            <time className="msg-time">
              {new Date(msg.spoke_started_at).toLocaleTimeString()}
            </time>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
