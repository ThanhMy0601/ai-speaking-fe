import { useEffect } from "react";
import { usePracticeStore } from "../store/practiceStore";
import { useTopicStore } from "../store/topicStore";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export default function SessionHistoryPage() {
  const { sessions, fetchSessions, loading } = usePracticeStore();
  const { topics, fetchTopics } = useTopicStore();

  useEffect(() => {
    fetchSessions();
    fetchTopics();
  }, [fetchSessions, fetchTopics]);

  const topicById = new Map(topics.map((t) => [t.id, t]));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">History</h1>
        <p className="mt-1.5 text-ink-muted">Every conversation you've had.</p>
      </header>

      {loading && sessions.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="🎙️"
          title="No sessions yet"
          description="Pick a topic and start talking — your first conversation shows up here."
          action={
            <Link to="/roadmap">
              <Button variant="primary">Browse topics</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => {
            const topic = session.topic_id ? topicById.get(session.topic_id) : undefined;
            const done = session.status === "completed";

            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-surface-glass p-4"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-sm text-lg"
                  style={
                    topic
                      ? {
                          background: `linear-gradient(135deg, ${topic.gradient_from}, ${topic.gradient_to})`,
                        }
                      : { background: "var(--color-surface-raised)" }
                  }
                  aria-hidden
                >
                  {topic?.icon ?? "💬"}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {topic?.title ?? "Free practice"}
                  </p>
                  <p className="text-xs text-ink-subtle">{formatDate(session.created_at)}</p>
                </div>

                {/* Labelled values. The old card rendered four unlabelled
                    columns whose CSS classes had no rules at all, so every
                    number looked identical and you couldn't tell duration
                    from score. */}
                <dl className="flex gap-5 text-sm">
                  <div>
                    <dt className="text-xs text-ink-subtle">Length</dt>
                    <dd className="tabular-nums">{formatDuration(session.duration_seconds)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-subtle">Turns</dt>
                    <dd className="tabular-nums">{session.turn_count || "—"}</dd>
                  </div>
                  <div className="hidden sm:block">
                    <dt className="text-xs text-ink-subtle">Words</dt>
                    <dd className="tabular-nums">{session.learner_word_count || "—"}</dd>
                  </div>
                </dl>

                <Badge tone={done ? "success" : session.status === "failed" ? "danger" : "neutral"}>
                  {done ? "Completed" : session.status}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
