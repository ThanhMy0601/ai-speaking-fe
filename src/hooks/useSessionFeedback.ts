import { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import type { FeedbackResponse } from "../types/api";
import type { SessionFeedback } from "../types/domain";

const POLL_MS = 3_000;
// Generation is a Gemini call behind a Sidekiq queue; if it hasn't landed in
// two minutes something is wrong and spinning forever is a lie.
const GIVE_UP_MS = 120_000;

const TERMINAL = new Set(["ready", "failed", "insufficient_data"]);

/**
 * Polls a session's feedback until it settles.
 *
 * Polling rather than a websocket on purpose: a session ends roughly once
 * every ten minutes per learner, so a subscription is more moving parts than
 * the problem deserves.
 */
export function useSessionFeedback(sessionId: number | null) {
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const { data } = await api.get<FeedbackResponse>(
          `/practice_sessions/${sessionId}/feedback`
        );
        if (cancelled) return;
        setFeedback(data.feedback);
        if (TERMINAL.has(data.feedback.status)) return;
      } catch {
        if (cancelled) return;
      }

      if (Date.now() - startedAt.current > GIVE_UP_MS) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  return { feedback, timedOut };
}
