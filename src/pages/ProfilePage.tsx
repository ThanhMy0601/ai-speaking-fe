import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import type { AchievementsResponse, ProgressResponse, StreaksResponse } from "../types/api";
import type { Achievement, Progress } from "../types/domain";
import StatTile from "../components/ui/StatTile";
import StreakCalendar from "../components/StreakCalendar";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const GOAL_LABELS: Record<string, string> = {
  general_conversation: "Everyday conversation",
  business_english: "Business English",
  travel: "Travel & living abroad",
  academic: "Academic English",
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      api.get<AchievementsResponse>("/progress/achievements"),
      api.get<StreaksResponse>("/progress/streaks"),
      api.get<ProgressResponse>("/progress"),
    ]).then((results) => {
      if (cancelled) return;
      const [ach, streaks, prog] = results;
      if (ach.status === "fulfilled") setAchievements(ach.value.data.achievements);
      if (streaks.status === "fulfilled") setStreakDates(streaks.value.data.recent_activity);
      if (prog.status === "fulfilled") setProgress(prog.value.data.progress);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const hours = Number(user.total_practice_hours) || 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-lg bg-linear-135 from-accent to-accent-to text-xl font-semibold"
          aria-hidden
        >
          {user.display_name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{user.display_name}</h1>
          <p className="truncate text-sm text-ink-muted">
            {user.proficiency_level && (
              <span className="capitalize">{user.proficiency_level}</span>
            )}
            {user.learning_goal && ` · ${GOAL_LABELS[user.learning_goal] ?? user.learning_goal}`}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total XP" value={user.total_xp} />
        <StatTile
          label="Streak"
          value={user.current_streak}
          hint={`Best: ${user.longest_streak}`}
        />
        <StatTile
          label="Topics done"
          value={progress ? progress.topics_completed : "—"}
        />
        <StatTile
          label="Practice"
          value={hours < 1 ? `${Math.round(hours * 60)}m` : `${hours.toFixed(1)}h`}
        />
      </section>

      <section className="rounded-lg border border-border bg-surface-glass p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-muted">Practice activity</h2>
        {loading ? (
          <Skeleton className="h-24" />
        ) : (
          <StreakCalendar activeDates={streakDates} />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-ink-muted">Achievements</h2>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Nothing unlocked yet"
            description="Finish a topic or build a streak and badges start appearing here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <div
                key={a.key}
                className="flex items-start gap-3 rounded-md border border-border bg-surface-glass p-4"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-sm bg-[rgb(251_191_36/0.16)] text-lg"
                  aria-hidden
                >
                  🏆
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-ink">{a.title}</p>
                  {a.description && (
                    <p className="mt-0.5 text-xs text-ink-muted">{a.description}</p>
                  )}
                  <p className="mt-1 text-2xs text-ink-subtle">
                    {new Date(a.earned_at).toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
