import { useEffect } from "react";
import { usePracticeStore } from "../store/practiceStore";

export default function SessionHistoryPage() {
  const { sessions, fetchSessions, loading } = usePracticeStore();

  // The session-type filter was dropped along with IELTS and role-play —
  // free_practice is the only type left, so a one-option select is noise.
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="history-page">
      <h1>Session History</h1>

      {loading && <p>Loading sessions...</p>}

      {/* Rows are not clickable yet: /sessions/:id has no route. The report
          screen lands in Phase 8, and until then a click would render a
          blank page. */}
      <div className="sessions-list" role="list">
        {sessions.map((session) => (
          <div key={session.id} className="session-card" role="listitem">
            <div className="session-date">
              {new Date(session.created_at).toLocaleDateString()}
            </div>
            <div className="session-duration">
              {session.duration_seconds
                ? `${Math.round(session.duration_seconds / 60)} min`
                : "—"}
            </div>
          </div>
        ))}
        {!loading && sessions.length === 0 && (
          <p>No sessions yet. Start practicing!</p>
        )}
      </div>
    </div>
  );
}
