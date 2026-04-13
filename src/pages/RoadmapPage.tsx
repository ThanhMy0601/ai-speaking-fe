import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLessonStore } from "../store/lessonStore";
import { useAuthStore } from "../store/authStore";

export default function RoadmapPage() {
  const { paths, lessons, currentPath, fetchPaths, fetchPath, loading } = useLessonStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  useEffect(() => {
    if (paths.length > 0 && !currentPath) {
      fetchPath(paths[0].id);
    }
  }, [paths, currentPath, fetchPath]);

  const handleLessonClick = (lesson: { id: number; status: string }) => {
    if (lesson.status === "locked") return;
    navigate(`/lessons/${lesson.id}`);
  };

  return (
    <div className="roadmap-page">
      <header className="roadmap-header">
        <h1>Learning Roadmap</h1>
        <div className="user-stats">
          <span className="stat">⚡ {user?.total_xp ?? 0} XP</span>
          <span className="stat">🔥 {user?.current_streak ?? 0} day streak</span>
        </div>
      </header>

      {currentPath && (
        <div className="path-info">
          <h2>{currentPath.title}</h2>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${currentPath.progress_percentage}%` }}
              role="progressbar"
              aria-valuenow={currentPath.progress_percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span>{currentPath.completed_lessons}/{currentPath.total_lessons} lessons</span>
        </div>
      )}

      <div className="lesson-path" role="list">
        {loading && <p>Loading lessons...</p>}
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            className={`lesson-node lesson-${lesson.status}`}
            onClick={() => handleLessonClick(lesson)}
            disabled={lesson.status === "locked"}
            role="listitem"
            aria-label={`${lesson.title} - ${lesson.status}`}
          >
            <div className="node-icon">
              {lesson.status === "completed" && "✅"}
              {lesson.status === "unlocked" && "📖"}
              {lesson.status === "in_progress" && "📝"}
              {lesson.status === "locked" && "🔒"}
            </div>
            <span className="node-title">{lesson.title}</span>
            <span className="node-duration">{lesson.estimated_duration_minutes} min</span>
          </button>
        ))}
      </div>

      <div className="practice-actions">
        <button onClick={() => navigate("/practice/free")} className="btn-primary">
          Free Practice
        </button>
        <button onClick={() => navigate("/practice/ielts")} className="btn-secondary">
          IELTS Mock Test
        </button>
        <button onClick={() => navigate("/practice/roleplay")} className="btn-secondary">
          Role Play
        </button>
      </div>
    </div>
  );
}
