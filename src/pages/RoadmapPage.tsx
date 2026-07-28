import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTopicStore, Topic } from "../store/topicStore";
import { useAuthStore } from "../store/authStore";

function TopicModal({
  topic,
  onClose,
  onStart,
  loading,
}: {
  topic: Topic;
  onClose: () => void;
  onStart: () => void;
  loading: boolean;
}) {
  return (
    <div className="topic-modal-overlay" onClick={onClose}>
      <div className="topic-modal" onClick={(e) => e.stopPropagation()}>
        <div className="topic-modal-header">
          <span className="topic-modal-icon">{topic.icon}</span>
          <div>
            <h2>{topic.title}</h2>
            <p>Topic {topic.sequence_order} of 10</p>
          </div>
        </div>

        <p className="topic-modal-desc">{topic.description}</p>

        <div
          style={{
            background: `linear-gradient(135deg, ${topic.gradient_from}15, ${topic.gradient_to}10)`,
            border: `1.5px solid ${topic.color}30`,
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: "1.75rem",
          }}
        >
          <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>
            <strong style={{ color: "#1e293b" }}>How it works:</strong> Your AI
            tutor will guide you through a natural English conversation focused
            on this topic. After the session, your progress will be marked as
            complete.
          </p>
        </div>

        {topic.completed && (
          <div
            style={{
              background: "#dcfce7",
              border: "1.5px solid #86efac",
              borderRadius: 10,
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              color: "#16a34a",
              fontWeight: 600,
            }}
          >
            ✅ You've completed this topic! Practice again anytime.
          </div>
        )}

        <div className="topic-modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={onStart}
            disabled={loading}
            style={{
              background: `linear-gradient(135deg, ${topic.gradient_from}, ${topic.gradient_to})`,
              border: "none",
            }}
          >
            {loading ? "Starting..." : topic.completed ? "Practice Again" : "Start Practice"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { topics, fetchTopics, loading } = useTopicStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const completedCount = topics.filter((t) => t.completed).length;
  const progressPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  const handleStartPractice = async () => {
    if (!selectedTopic) return;
    setStarting(true);
    navigate(`/practice/free?topic_id=${selectedTopic.id}&topic_title=${encodeURIComponent(selectedTopic.title)}`);
  };

  return (
    <div className="topics-page">
      {/* Header */}
      <div className="topics-header">
        <div className="topics-header-left">
          <h1>Your Learning Journey</h1>
          <p>10 topics to master English — one conversation at a time</p>
        </div>
        <div className="topics-stats">
          <div className="stat-pill">
            ⚡ {user?.total_xp ?? 0} XP
          </div>
          <div className="stat-pill">
            🔥 {user?.current_streak ?? 0} day streak
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="topics-progress-bar">
        <span className="progress-label">Overall Progress</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="progress-count">{completedCount}/{topics.length} topics</span>
      </div>

      {/* Topics Journey Grid */}
      {loading && <div className="loading">Loading topics...</div>}

      <div className="topics-journey">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`topic-card${topic.completed ? " completed" : ""}`}
            onClick={() => setSelectedTopic(topic)}
            role="button"
            aria-label={`Topic: ${topic.title}`}
          >
            {/* Banner */}
            <div
              className="topic-card-banner"
              style={{
                background: `linear-gradient(135deg, ${topic.gradient_from}, ${topic.gradient_to})`,
              }}
            >
              <span className="topic-icon">{topic.icon}</span>
              <span className="topic-number">{topic.sequence_order}</span>
              {topic.completed && (
                <div className="topic-completed-badge">✅</div>
              )}
            </div>

            {/* Body */}
            <div className="topic-card-body">
              <div className="topic-card-sequence">Topic {topic.sequence_order}</div>
              <div className="topic-card-title">{topic.title}</div>
              <div className="topic-card-desc">{topic.description}</div>

              <div className="topic-card-action">
                <button
                  className="topic-start-btn"
                  style={{
                    background: `linear-gradient(135deg, ${topic.gradient_from}, ${topic.gradient_to})`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTopic(topic);
                  }}
                >
                  {topic.completed ? "Practice Again" : "Start"} →
                </button>
                <div className={`topic-status-label ${topic.completed ? "done" : "new"}`}>
                  {topic.completed ? (
                    <><span>✓</span> Completed</>
                  ) : (
                    <><span>○</span> Not started</>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Topic Practice Modal */}
      {selectedTopic && (
        <TopicModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onStart={handleStartPractice}
          loading={starting}
        />
      )}
    </div>
  );
}
