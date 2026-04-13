import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";

interface Achievement {
  key: string;
  title: string;
  description: string;
  icon_url: string;
  earned_at: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streakDates, setStreakDates] = useState<string[]>([]);

  useEffect(() => {
    api.get("/progress/achievements").then(({ data }) => setAchievements(data.achievements));
    api.get("/progress/streaks").then(({ data }) => setStreakDates(data.recent_activity));
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
