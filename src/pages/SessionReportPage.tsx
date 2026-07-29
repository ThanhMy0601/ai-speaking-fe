import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSessionReport } from "../hooks/useSessionReport";
import { useSessionFeedback } from "../hooks/useSessionFeedback";
import { useTopicStore } from "../store/topicStore";
import { formatClock } from "../hooks/useElapsed";

import AudioPlayer, { type AudioPlayerHandle } from "../components/report/AudioPlayer";
import ReportTranscript from "../components/report/ReportTranscript";
import FeedbackSummary from "../components/practice/FeedbackSummary";
import StatTile from "../components/ui/StatTile";
import Skeleton from "../components/ui/Skeleton";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

import { useEffect } from "react";

const SETTLED = new Set(["ready", "failed", "insufficient_data"]);

// LiveKit's EgressStatus values that mean "this recording is never coming".
const RECORDING_DEAD = new Set(["failed", "aborted", "limit_reached", "unavailable"]);

export default function SessionReportPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = id ? Number(id) : null;

  const { session, transcript, recording, loading, notFound, refreshRecording } =
    useSessionReport(sessionId);
  const { feedback, timedOut } = useSessionFeedback(sessionId);
  const { topics, fetchTopics } = useTopicStore();

  const playerRef = useRef<AudioPlayerHandle>(null);
  const [positionMs, setPositionMs] = useState<number | null>(null);

  useEffect(() => {
    if (topics.length === 0) fetchTopics();
  }, [topics.length, fetchTopics]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <span className="text-4xl" aria-hidden>
          🔍
        </span>
        <h1 className="text-xl font-semibold">Session not found</h1>
        <p className="text-ink-muted">
          It may have been removed, or belong to a different account.
        </p>
        <Link to="/sessions">
          <Button variant="primary">Back to history</Button>
        </Link>
      </div>
    );
  }

  const topic = session.topic_id ? topics.find((t) => t.id === session.topic_id) : undefined;
  const playable = recording?.status === "complete" && recording.url;
  const recordingDead = !recording || RECORDING_DEAD.has(recording.status);
  const feedbackSettled = feedback && SETTLED.has(feedback.status);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-md text-xl"
            style={
              topic
                ? { background: `linear-gradient(135deg, ${topic.gradient_from}, ${topic.gradient_to})` }
                : { background: "var(--color-surface-raised)" }
            }
            aria-hidden
          >
            {topic?.icon ?? "💬"}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">
              {topic?.title ?? "Free practice"}
            </h1>
            <p className="text-sm text-ink-subtle">
              {new Date(session.created_at).toLocaleString([], {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <Badge tone={session.status === "completed" ? "success" : "neutral"}>
          {session.status === "completed" ? "Completed" : session.status}
        </Badge>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatTile label="Length" value={formatClock(session.duration_seconds ?? 0)} />
        <StatTile label="Turns" value={session.turn_count || "—"} />
        <StatTile label="Words" value={session.learner_word_count || "—"} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink-muted">Listen back</h2>

        {playable ? (
          <AudioPlayer
            ref={playerRef}
            url={recording.url!}
            durationMs={recording.duration_ms}
            onTimeUpdate={setPositionMs}
            onExpired={refreshRecording}
          />
        ) : recordingDead ? (
          <p className="rounded-md border border-border bg-surface-glass px-4 py-3.5 text-sm text-ink-muted">
            No recording is available for this session.
          </p>
        ) : (
          // "starting" / "active" / "ending": the upload is still in flight.
          <div className="flex items-center gap-3 rounded-md border border-border bg-surface-glass px-4 py-3.5">
            <Skeleton className="size-10 rounded-full" />
            <p className="text-sm text-ink-muted">Your recording is still uploading…</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">Transcript</h2>
          {playable && (
            <p className="text-xs text-ink-subtle">Tap any line to jump to it</p>
          )}
        </div>
        <ReportTranscript
          messages={transcript}
          positionMs={playable ? positionMs : null}
          onSeek={playable ? (ms) => playerRef.current?.seekTo(ms) : undefined}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink-muted">Feedback</h2>

        {feedbackSettled && feedback ? (
          <FeedbackSummary feedback={feedback} />
        ) : timedOut ? (
          <p className="rounded-md border border-border bg-surface-glass px-4 py-3.5 text-sm text-ink-muted">
            Feedback is taking longer than expected. Check back shortly.
          </p>
        ) : (
          <div className="flex flex-col gap-3" aria-live="polite">
            <p className="text-sm text-ink-muted">Analysing your conversation…</p>
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-20" />
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {topic && (
          <Link
            to={`/practice/free?topic_id=${topic.id}&topic_title=${encodeURIComponent(topic.title)}`}
          >
            <Button variant="primary">Practise this topic again</Button>
          </Link>
        )}
        <Link to="/sessions">
          <Button variant="secondary">All sessions</Button>
        </Link>
      </div>
    </div>
  );
}
