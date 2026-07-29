import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FeedbackSummary from "./FeedbackSummary";
import type { SessionFeedback } from "../../types/domain";

const base: SessionFeedback = {
  status: "ready",
  grammar_corrections: [],
  vocabulary_upgrades: [],
  fluency_assessment: {},
  strengths: [],
  overall_summary: null,
  conversation_stats: {},
};

describe("FeedbackSummary honesty contract", () => {
  // The backend deliberately never fabricates feedback, so the UI must not
  // paper over the states where there is nothing real to show.
  it("says feedback is unavailable when generation failed", () => {
    render(<FeedbackSummary feedback={{ ...base, status: "failed" }} />);

    expect(screen.getByText(/couldn't be generated/i)).toBeInTheDocument();
    expect(screen.getByText(/transcript is still saved/i)).toBeInTheDocument();
  });

  it("explains a session was too short instead of inventing praise", () => {
    render(<FeedbackSummary feedback={{ ...base, status: "insufficient_data" }} />);

    expect(screen.getByText(/too short to analyse/i)).toBeInTheDocument();
  });

  // An empty grammar array is a valid, correct result — the model is
  // instructed to return one rather than inventing errors to look useful.
  it("treats zero grammar errors as a good result, not an empty panel", () => {
    render(
      <FeedbackSummary
        feedback={{ ...base, overall_summary: "Solid session." }}
      />
    );

    expect(screen.getByText(/no grammar issues worth flagging/i)).toBeInTheDocument();
  });

  it("renders real corrections with the original and the fix", () => {
    render(
      <FeedbackSummary
        feedback={{
          ...base,
          grammar_corrections: [
            {
              original: "I am work as a software engineer",
              corrected: "I have been working as a software engineer",
              explanation: "Use the present perfect continuous for an ongoing job.",
              category: "tense",
            },
          ],
          strengths: ["Clear explanation of your role"],
        }}
      />
    );

    expect(screen.getByText("I am work as a software engineer")).toBeInTheDocument();
    expect(
      screen.getByText("I have been working as a software engineer")
    ).toBeInTheDocument();
    expect(screen.getByText(/present perfect continuous/i)).toBeInTheDocument();
    expect(screen.getByText("Clear explanation of your role")).toBeInTheDocument();
  });

  it("shows the Ruby-computed conversation stats", () => {
    render(
      <FeedbackSummary
        feedback={{
          ...base,
          conversation_stats: {
            learner_word_count: 62,
            words_per_minute: 8.9,
            filler_word_count: 3,
          },
        }}
      />
    );

    expect(screen.getByText("62 words spoken")).toBeInTheDocument();
    expect(screen.getByText("8.9 words / min")).toBeInTheDocument();
    expect(screen.getByText("3 filler words")).toBeInTheDocument();
  });
});
