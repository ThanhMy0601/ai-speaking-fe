import { useEffect, useRef } from "react";

interface Message {
  index: number;
  speaker: "learner" | "ai";
  text: string;
  timestamp: string;
  pronunciation_score?: number;
}

interface Props {
  messages: Message[];
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
        <div key={msg.index} className={`transcript-msg msg-${msg.speaker}`}>
          <span className="msg-speaker">{msg.speaker === "learner" ? "You" : "AI"}</span>
          <p className="msg-text">{msg.text}</p>
          {msg.pronunciation_score != null && (
            <span className="msg-score" title="Pronunciation score">
              🎯 {msg.pronunciation_score}/100
            </span>
          )}
          <time className="msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</time>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
