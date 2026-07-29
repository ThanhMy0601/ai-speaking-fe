import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTopicStore } from "../store/topicStore";
import { useAuthStore } from "../store/authStore";
import type { Topic } from "../types/domain";
import TopicCard from "../components/TopicCard";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

export default function RoadmapPage() {
  const { topics, fetchTopics, loading } = useTopicStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Topic | null>(null);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const completed = topics.filter((t) => t.completed);
  const nextUp = topics.find((t) => !t.completed);

  const start = (topic: Topic) => {
    navigate(
      `/practice/free?topic_id=${topic.id}&topic_title=${encodeURIComponent(topic.title)}`
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Your journey</h1>
          <p className="mt-1.5 text-ink-muted">
            Ten topics. One conversation at a time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="accent">⚡ {user?.total_xp ?? 0} XP</Badge>
          <Badge tone={user?.current_streak ? "warning" : "neutral"}>
            🔥 {user?.current_streak ?? 0} day streak
          </Badge>
        </div>
      </header>

      {topics.length > 0 && (
        <section className="rounded-lg border border-border bg-surface-glass p-5">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-ink-muted">Progress</h2>
            <span className="text-sm text-ink-subtle tabular-nums">
              {completed.length} of {topics.length}
            </span>
          </div>
          <ProgressBar
            value={completed.length}
            max={topics.length}
            label="Topics completed"
          />

          {nextUp && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="min-w-0">
                <p className="text-xs text-ink-subtle">Up next</p>
                <p className="truncate font-medium text-ink">
                  <span aria-hidden className="mr-1.5">
                    {nextUp.icon}
                  </span>
                  {nextUp.title}
                </p>
              </div>
              <Button variant="primary" onClick={() => start(nextUp)}>
                Continue
              </Button>
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="sr-only">All topics</h2>

        {loading && topics.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState
            icon="🗺️"
            title="No topics yet"
            description="Topics haven't been set up on the server. Seed the database to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} onSelect={setSelected} />
            ))}
          </div>
        )}
      </section>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => selected && start(selected)}>
              {selected?.completed ? "Practise again" : "Start practising"}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-md text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${selected.gradient_from}, ${selected.gradient_to})`,
                }}
                aria-hidden
              >
                {selected.icon}
              </span>
              <div className="flex flex-wrap gap-2">
                <Badge>{selected.estimated_minutes} min</Badge>
                {selected.cefr_level && (
                  <Badge tone="info">{selected.cefr_level.toUpperCase()}</Badge>
                )}
                {selected.level_count > 1 && (
                  <Badge tone="accent">{selected.level_count} levels</Badge>
                )}
              </div>
            </div>

            <p className="text-ink-muted">{selected.description}</p>

            {selected.completed ? (
              <div className="rounded-md border border-[rgb(74_222_128/0.28)] bg-success-dim px-3.5 py-3 text-sm text-success">
                Practised {selected.attempt_count}{" "}
                {selected.attempt_count === 1 ? "time" : "times"}.
                {selected.level_count > 1 && (
                  <>
                    {" "}
                    Next session goes to level{" "}
                    {Math.min(selected.attempt_count + 1, selected.level_count)} of{" "}
                    {selected.level_count}.
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface-glass px-3.5 py-3 text-sm text-ink-muted">
                Your tutor opens the conversation on this topic — no need to
                think of something to say first.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
