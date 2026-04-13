import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLessonStore } from "../store/lessonStore";

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentLesson, fetchLesson, completeLesson, loading } = useLessonStore();
  const [currentStage, setCurrentStage] = useState(0);
  const [_score] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchLesson(Number(id));
  }, [id, fetchLesson]);

  const stages = currentLesson?.stages ?? [];
  const stage = stages[currentStage];

  const handleNext = () => {
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    const finalScore = Math.max(_score, 70); // minimum score for completion
    await completeLesson(Number(id), finalScore);
    navigate("/roadmap");
  };

  if (loading || !currentLesson) return <div className="loading">Loading lesson...</div>;

  return (
    <div className="lesson-detail-page">
      <header>
        <button onClick={() => navigate("/roadmap")} className="back-btn" aria-label="Back to roadmap">
          ← Back
        </button>
        <h1>{currentLesson.title}</h1>
        <p>{currentLesson.description}</p>
      </header>

      <div className="stage-progress">
        {stages.map((s, i) => (
          <span
            key={s.stage}
            className={`stage-dot ${i === currentStage ? "active" : i < currentStage ? "done" : ""}`}
          >
            {s.stage}
          </span>
        ))}
      </div>

      {stage && (
        <div className="stage-content">
          <h2>{stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1)}</h2>

          {stage.stage === "vocabulary" && currentLesson.vocabulary_items && (
            <div className="vocabulary-list">
              {currentLesson.vocabulary_items.map((item) => (
                <div key={item.id} className="vocab-card">
                  <strong>{item.word}</strong>
                  <span className="phonetic">{item.phonetic}</span>
                  <p>{item.definition}</p>
                  <p className="example"><em>{item.example_sentence}</em></p>
                </div>
              ))}
            </div>
          )}

          {stage.stage !== "vocabulary" && (
            <pre className="stage-data">{JSON.stringify(stage.data, null, 2)}</pre>
          )}
        </div>
      )}

      <div className="lesson-actions">
        {currentStage < stages.length - 1 ? (
          <button onClick={handleNext} className="btn-primary">
            Next: {stages[currentStage + 1]?.stage}
          </button>
        ) : (
          <button onClick={handleComplete} className="btn-primary">
            Complete Lesson
          </button>
        )}
      </div>
    </div>
  );
}
