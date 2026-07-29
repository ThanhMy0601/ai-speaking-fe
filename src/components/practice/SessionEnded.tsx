import { Link } from "react-router-dom";
import { useSessionFeedback } from "../../hooks/useSessionFeedback";
import { formatClock } from "../../hooks/useElapsed";
import FeedbackSummary from "./FeedbackSummary";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";
import StatTile from "../ui/StatTile";

interface Props {
  sessionId: number | null;
  topicTitle?: string;
  durationSeconds: number;
  turnCount: number;
  onPractiseAgain: () => void;
}

/**
 * What you see the moment a session ends.
 *
 * The old room called navigate("/roadmap") here, which threw away the sense
 * of having finished something and hid the fact that analysis was already
 * running in the background. Staying put lets the summary land immediately
 * and the feedback fill in behind it.
 */
export default function SessionEnded({
  sessionId,
  topicTitle,
  durationSeconds,
  turnCount,
  onPractiseAgain,
}: Props) {
  const { feedback, timedOut } = useSessionFeedback(sessionId);
  const settled =
    feedback && ["ready", "failed", "insufficient_data"].includes(feedback.status);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4">
      <header
        className="flex flex-col items-center gap-3 text-center"
        style={{ animation: "rise var(--duration-slow) var(--ease-out-expo)" }}
      >
        <span
          className="grid size-14 place-items-center rounded-full bg-[rgb(74_222_128/0.16)] text-2xl"
          aria-hidden
        >
          ✓
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Session complete</h1>
          <p className="mt-1 text-ink-muted">
            {topicTitle ? `You practised ${topicTitle}.` : "Nice work."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Time" value={formatClock(durationSeconds)} />
        <StatTile label="Turns" value={turnCount} />
      </div>

      <section className="rounded-lg border border-border bg-surface-glass p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-muted">Your feedback</h2>

        {timedOut && !settled ? (
          <p className="text-sm text-ink-muted">
            Feedback is taking longer than expected. It'll be waiting in your
            history shortly.
          </p>
        ) : settled && feedback ? (
          <FeedbackSummary feedback={feedback} />
        ) : (
          <div className="flex flex-col gap-3" aria-live="polite">
            <p className="text-sm text-ink-muted">Analysing your conversation…</p>
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-20" />
          </div>
        )}
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={onPractiseAgain}>
          Practise again
        </Button>
        {sessionId && (
          // The full report adds the recording and a click-to-seek
          // transcript on top of the feedback shown above.
          <Link to={`/sessions/${sessionId}`}>
            <Button variant="secondary">Listen back</Button>
          </Link>
        )}
        <Link to="/roadmap">
          <Button variant="ghost">Back to topics</Button>
        </Link>
      </div>

      <style>{"@keyframes rise{from{opacity:0;transform:translateY(10px)}}"}</style>
    </div>
  );
}
