import type { SessionFeedback } from "../../types/domain";
import Badge from "../ui/Badge";

interface Props {
  feedback: SessionFeedback;
}

/**
 * Renders real post-session analysis. Reused by the full report screen.
 *
 * Every branch here is honest about what the backend actually produced:
 * "failed" says feedback is unavailable rather than showing filler, and an
 * empty grammar list is presented as a good result, because it is one.
 */
export default function FeedbackSummary({ feedback }: Props) {
  const stats = feedback.conversation_stats ?? {};
  const grammar = feedback.grammar_corrections ?? [];
  const vocab = feedback.vocabulary_upgrades ?? [];
  const strengths = feedback.strengths ?? [];

  if (feedback.status === "insufficient_data") {
    return (
      <div className="rounded-md border border-border bg-surface-glass px-4 py-3.5 text-sm text-ink-muted">
        That session was too short to analyse. Talk for a minute or two and
        you'll get notes on grammar, vocabulary and fluency.
      </div>
    );
  }

  if (feedback.status === "failed") {
    return (
      <div className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-4 py-3.5 text-sm text-danger">
        Feedback couldn't be generated for this session. Your transcript is
        still saved.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {feedback.overall_summary && (
        <p className="text-ink">{feedback.overall_summary}</p>
      )}

      {(stats.learner_word_count != null || stats.words_per_minute != null) && (
        <div className="flex flex-wrap gap-2">
          {stats.learner_word_count != null && (
            <Badge>{stats.learner_word_count} words spoken</Badge>
          )}
          {stats.words_per_minute != null && (
            <Badge>{stats.words_per_minute} words / min</Badge>
          )}
          {stats.filler_word_count != null && (
            <Badge tone={stats.filler_word_count > 8 ? "warning" : "neutral"}>
              {stats.filler_word_count} filler words
            </Badge>
          )}
        </div>
      )}

      {strengths.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-success">What went well</h3>
          <ul className="flex flex-col gap-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-muted">
                <span aria-hidden className="text-success">
                  ✓
                </span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink">Grammar</h3>
        {grammar.length === 0 ? (
          // An empty array is a valid, correct result — the model is told to
          // return one rather than inventing errors to look useful.
          <p className="text-sm text-ink-muted">
            No grammar issues worth flagging in this conversation. Nice.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {grammar.map((g, i) => (
              <li key={i} className="rounded-md border border-border bg-surface-glass p-3.5">
                <p className="text-sm text-ink-subtle line-through decoration-danger/60">
                  {g.original}
                </p>
                <p className="mt-1 text-sm font-medium text-success">{g.corrected}</p>
                <p className="mt-1.5 text-xs text-ink-muted">{g.explanation}</p>
                {g.category && (
                  <span className="mt-2 inline-block text-2xs tracking-wide text-ink-subtle uppercase">
                    {g.category}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {vocab.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink">Say it more naturally</h3>
          <ul className="flex flex-col gap-2">
            {vocab.map((v, i) => (
              <li
                key={i}
                className="rounded-md border border-border bg-surface-glass p-3.5 text-sm"
              >
                <span className="text-ink-subtle">{v.used}</span>
                <span aria-hidden className="mx-2 text-ink-subtle">
                  →
                </span>
                <span className="font-medium text-accent-soft">{v.suggestion}</span>
                <p className="mt-1 text-xs text-ink-muted">{v.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {feedback.fluency_assessment?.summary && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink">Fluency</h3>
          <p className="text-sm text-ink-muted">{feedback.fluency_assessment.summary}</p>
        </section>
      )}
    </div>
  );
}
