import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { UserResponse } from "../types/api";
import type { LearningGoal, ProficiencyLevel } from "../types/domain";
import Button from "../components/ui/Button";
import OptionCard from "../components/ui/OptionCard";

// Mirrors User::LEARNING_GOALS in the Rails model. IELTS was removed from
// the product in Phase 2; these values feed prompt personalization.
const LEARNING_GOALS: { value: LearningGoal; label: string; hint: string }[] = [
  {
    value: "general_conversation",
    label: "Everyday conversation",
    hint: "Small talk, daily life, making friends",
  },
  {
    value: "business_english",
    label: "Business English",
    hint: "Meetings, presentations, professional networking",
  },
  {
    value: "travel",
    label: "Travel & living abroad",
    hint: "Airports, hotels, directions, local culture",
  },
  {
    value: "academic",
    label: "Academic English",
    hint: "Study, campus life, discussing complex ideas",
  },
];

// The level drives how the tutor actually speaks — sentence length,
// vocabulary, and how long it waits before assuming you've finished.
const LEVELS: { value: ProficiencyLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "Short sentences, common words, patient pauses" },
  { value: "intermediate", label: "Intermediate", hint: "Open questions, natural pace" },
  { value: "advanced", label: "Advanced", hint: "Idioms, abstract topics, no hand-holding" },
];

export default function OnboardingPage() {
  const [learningGoal, setLearningGoal] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [weeklyMinutes, setWeeklyMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
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
      setError("Couldn't save that. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <p className="text-sm font-medium text-accent-soft">Step 1 of 1</p>
        <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">
          Let's tune the tutor to you
        </h1>
        <p className="mt-2 text-ink-muted">
          This changes how your tutor talks — not just what it talks about.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {error && (
          <div
            role="alert"
            className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-3.5 py-2.5 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold text-ink">
            What do you want to use English for?
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {LEARNING_GOALS.map((goal) => (
              <OptionCard
                key={goal.value}
                name="goal"
                value={goal.value}
                checked={learningGoal === goal.value}
                onChange={setLearningGoal}
                label={goal.label}
                hint={goal.hint}
                required
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold text-ink">
            How comfortable are you speaking right now?
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {LEVELS.map((level) => (
              <OptionCard
                key={level.value}
                name="level"
                value={level.value}
                checked={proficiencyLevel === level.value}
                onChange={setProficiencyLevel}
                label={level.label}
                hint={level.hint}
                required
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold text-ink">
            How much do you want to practise each week?
          </legend>
          <div className="rounded-md border border-border bg-surface-glass p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <label htmlFor="weeklyMinutes" className="text-sm text-ink-muted">
                Weekly target
              </label>
              <output htmlFor="weeklyMinutes" className="text-lg font-semibold tabular-nums">
                {weeklyMinutes} min
              </output>
            </div>
            <input
              id="weeklyMinutes"
              type="range"
              min={15}
              max={300}
              step={15}
              value={weeklyMinutes}
              onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="mt-1.5 flex justify-between text-xs text-ink-subtle">
              <span>15 min</span>
              <span>5 hours</span>
            </div>
          </div>
        </fieldset>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!learningGoal || !proficiencyLevel}
        >
          Start practising
        </Button>
      </form>
    </div>
  );
}
