import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import type { AchievementsResponse, StreaksResponse } from "../types/api";
import type { Achievement } from "../types/domain";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streakDates, setStreakDates] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    api
      .get<AchievementsResponse>("/progress/achievements")
      .then(({ data }) => !cancelled && setAchievements(data.achievements))
      .catch(() => !cancelled && setAchievements([]));
    api
      .get<StreaksResponse>("/progress/streaks")
      .then(({ data }) => !cancelled && setStreakDates(data.recent_activity))
      .catch(() => !cancelled && setStreakDates([]));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  return (
    <div className="profile-page">
      <h1>{user.display_name}'s Profile</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{user.total_xp}</span>
          <span className="stat-label">Total XP</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user.current_streak}</span>
          <span className="stat-label">Current Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user.longest_streak}</span>
          <span className="stat-label">Longest Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user.total_practice_hours}h</span>
          <span className="stat-label">Practice Hours</span>
        </div>
      </div>

      <section>
        <h2>Achievements</h2>
        {achievements.length === 0 && <p>No achievements yet. Keep practicing!</p>}
        <div className="achievements-grid">
          {achievements.map((a) => (
            <div key={a.key} className="achievement-card">
              <span className="achievement-icon">🏆</span>
              <strong>{a.title}</strong>
              <p>{a.description}</p>
              <small>Earned {new Date(a.earned_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Recent Activity</h2>
        <div className="streak-calendar">
          {streakDates.map((date) => (
            <span key={date} className="streak-day active" title={date}>
              ●
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
