import { useEffect, useRef, useState } from "react";
import { useVocabularyStore } from "../store/vocabularyStore";
import WordCard from "../components/vocabulary/WordCard";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

/** How often to re-check while a lookup is still running. */
const POLL_MS = 3000;

// Enrichment is a Gemini call behind a Sidekiq queue. With no worker running,
// the row sits at "enriching" forever and polling would spin for the life of
// the tab — the same lie useSessionFeedback refuses to tell. After two
// minutes, say so instead.
const GIVE_UP_MS = 120_000;

export default function VocabularyPage() {
  const {
    notes,
    loading,
    saving,
    error,
    fetchNotes,
    addWord,
    removeNote,
    hasPending,
    clearError,
  } = useVocabularyStore();

  const [term, setTerm] = useState("");
  const [note, setNote] = useState("");
  const [stalled, setStalled] = useState(false);
  const pendingSince = useRef<number | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Enrichment runs in a background job, so a freshly saved card arrives
  // "pending". Poll only while something is actually unsettled — a permanent
  // interval would hammer the API for a shelf that will never change.
  useEffect(() => {
    if (!hasPending()) {
      pendingSince.current = null;
      setStalled(false);
      return;
    }

    pendingSince.current ??= Date.now();
    if (Date.now() - pendingSince.current > GIVE_UP_MS) {
      setStalled(true);
      return;
    }

    const id = setInterval(fetchNotes, POLL_MS);
    return () => clearInterval(id);
  }, [notes, hasPending, fetchNotes]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    try {
      await addWord(term.trim(), note.trim() || undefined);
      setTerm("");
      setNote("");
    } catch {
      // The store holds the message; it renders below the form.
    }
  };

  const field =
    "w-full rounded-sm border border-border bg-surface-base px-3 py-2 text-sm text-ink " +
    "placeholder:text-ink-subtle focus-visible:border-border-focus";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Sổ từ vựng</h1>
        <p className="mt-1.5 text-ink-muted">
          Lưu từ hoặc cụm từ bạn muốn nhớ — hệ thống tự tra loại từ, nghĩa tiếng Việt,
          ví dụ và phát âm.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface-glass p-5"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            aria-label="Từ hoặc cụm từ"
            className={field}
            placeholder="vd. resilient, run errands"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              if (error) clearError();
            }}
          />
          <input
            aria-label="Ghi chú của bạn (không bắt buộc)"
            className={field}
            placeholder="ghi chú riêng (không bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button type="submit" variant="primary" loading={saving} disabled={!term.trim()}>
            Lưu từ
          </Button>
        </div>

        <p className="text-xs text-ink-subtle">
          Phát âm là giọng Anh-Anh và Anh-Mỹ được tổng hợp, không phải bản thu của từ
          điển.
        </p>

        {error && (
          <p className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
      </form>

      {loading && notes.length === 0 ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon="📒"
          title="Sổ từ vựng đang trống"
          description="Gõ một từ bạn vừa gặp vào ô phía trên — hoặc mở một chủ đề và lưu từ trong đó."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-ink-subtle">{notes.length} từ đã lưu</p>
            {stalled && (
              <p className="text-sm text-warning">
                Việc tra từ đang lâu hơn bình thường — có thể worker nền chưa chạy.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {notes.map((n) => (
              <WordCard key={n.id} note={n} onRemove={removeNote} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
