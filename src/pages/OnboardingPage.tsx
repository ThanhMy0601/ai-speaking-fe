import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { UserResponse } from "../types/api";
import type { LearningGoal } from "../types/domain";

// Mirrors User::LEARNING_GOALS in the Rails model. IELTS was removed from
// the product in Phase 2; these values feed prompt personalization.
const LEARNING_GOALS: { value: LearningGoal; label: string; hint: string }[] = [
  {
    value: "general_conversation",
    label: "Everyday Conversation",
    hint: "Small talk, daily life, making friends",
  },
  {
    value: "business_english",
    label: "Business English",
    hint: "Meetings, presentations, professional networking",
  },
  {
    value: "travel",
    label: "Travel & Living Abroad",
    hint: "Airports, hotels, directions, local culture",
  },
  {
    value: "academic",
    label: "Academic English",
    hint: "Study, campus life, discussing complex ideas",
  },
];

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
      const { data } = await api.post<UserResponse>("/users/onboarding", {
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
            {LEARNING_GOALS.map((goal) => (
              <label key={goal.value} className="radio-card">
                <input
                  type="radio"
                  name="goal"
                  value={goal.value}
                  checked={learningGoal === goal.value}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  required
                />
                <span>{goal.label}</span>
                <small>{goal.hint}</small>
              </label>
            ))}
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
