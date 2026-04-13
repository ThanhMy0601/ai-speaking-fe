import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePracticeStore } from "../store/practiceStore";

export default function SessionHistoryPage() {
  const { sessions, fetchSessions, loading } = usePracticeStore();
  const [typeFilter, setTypeFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions(typeFilter ? { session_type: typeFilter } : undefined);
  }, [typeFilter, fetchSessions]);

  return (
    <div className="history-page">
      <h1>Session History</h1>

      <div className="filters">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by session type"
        >
          <option value="">All Types</option>
          <option value="free_practice">Free Practice</option>
          <option value="ielts_mock_test">IELTS Mock Test</option>
          <option value="role_play">Role Play</option>
        </select>
      </div>

      {loading && <p>Loading sessions...</p>}

      <div className="sessions-list" role="list">
        {sessions.map((session) => (
          <button
            key={session.id}
            className="session-card"
            onClick={() => navigate(`/sessions/${session.id}`)}
            role="listitem"
          >
            <div className="session-type">{session.session_type.replace(/_/g, " ")}</div>
            <div className="session-date">
              {new Date(session.created_at).toLocaleDateString()}
            </div>
            <div className="session-duration">
              {session.duration_seconds
                ? `${Math.round(session.duration_seconds / 60)} min`
                : "—"}
            </div>
            <div className="session-score">
              {session.overall_score != null ? `${session.overall_score}/100` : "—"}
            </div>
          </button>
        ))}
        {!loading && sessions.length === 0 && (
          <p>No sessions yet. Start practicing!</p>
        )}
      </div>
    </div>
  );
}
