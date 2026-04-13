import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function OnboardingPage() {
  const [learningGoal, setLearningGoal] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [weeklyMinutes, setWeeklyMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/users/onboarding", {
        learning_goal: learningGoal,
        proficiency_level: proficiencyLevel,
        weekly_practice_minutes: weeklyMinutes,
      });
      setUser(data.user);
      navigate("/roadmap");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h1>Let's personalize your learning</h1>
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>What's your learning goal?</legend>
            <label className="radio-card">
              <input
                type="radio"
                name="goal"
                value="business_english"
                checked={learningGoal === "business_english"}
                onChange={(e) => setLearningGoal(e.target.value)}
                required
              />
              <span>Business English</span>
              <small>Negotiations, presentations, meetings</small>
            </label>
            <label className="radio-card">
              <input
                type="radio"
                name="goal"
                value="ielts_speaking"
                checked={learningGoal === "ielts_speaking"}
                onChange={(e) => setLearningGoal(e.target.value)}
              />
              <span>IELTS Speaking</span>
              <small>Part 1, 2, 3 exam preparation</small>
            </label>
          </fieldset>

          <fieldset>
            <legend>Your current English level?</legend>
            {["beginner", "intermediate", "advanced"].map((level) => (
              <label key={level} className="radio-card">
                <input
                  type="radio"
                  name="level"
                  value={level}
                  checked={proficiencyLevel === level}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  required
                />
                <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
              </label>
            ))}
          </fieldset>

          <label htmlFor="weeklyMinutes">
            Weekly practice time: {weeklyMinutes} minutes
          </label>
          <input
            id="weeklyMinutes"
            type="range"
            min={15}
            max={300}
            step={15}
            value={weeklyMinutes}
            onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
          />

          <button type="submit" disabled={loading || !learningGoal || !proficiencyLevel}>
            {loading ? "Setting up..." : "Start Learning"}
          </button>
        </form>
      </div>
    </div>
  );
}
