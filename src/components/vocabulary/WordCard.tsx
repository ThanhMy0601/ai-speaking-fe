import { useRef, useState } from "react";
import type { VocabularyNote } from "../../types/domain";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";

interface Props {
  note: VocabularyNote;
  onRemove: (id: number) => void;
}

import api from "../../lib/api";

/**
 * One saved word.
 *
 * Three states, all shown honestly. A card that is still being looked up says
 * so; one that failed says so and offers nothing else. There is no branch that
 * renders an empty meaning as though the lookup had succeeded — an invented
 * definition is worse for a learner than a visible gap.
 */
export default function WordCard({ note, onRemove }: Props) {
  const { entry } = note;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const play = async (accent: "uk" | "us") => {
    audioRef.current?.pause();
    setPlaying(accent);
    try {
      // Two steps on purpose. The link is minted per play so its 15-minute
      // life never expires under a page left open, and it has to come over an
      // authenticated request — a media element cannot send a Bearer token.
      // Playing the returned link directly is fine: media elements are not
      // subject to CORS the way fetch is.
      const { data } = await api.get<{ url: string }>(
        `/vocabulary_entries/${entry.id}/audio/${accent}`
      );
      const audio = new Audio(data.url);
      audioRef.current = audio;
      audio.addEventListener("ended", () => setPlaying(null));
      audio.addEventListener("error", () => setPlaying(null));
      await audio.play();
    } catch {
      setPlaying(null);
    }
  };

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface-glass p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-ink">{entry.term}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {entry.part_of_speech && <Badge tone="info">{entry.part_of_speech}</Badge>}
            {entry.register && entry.register !== "neutral" && (
              <Badge tone="neutral">{entry.register}</Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <AudioButton
            label="UK"
            available={entry.has_audio_uk}
            active={playing === "uk"}
            onPlay={() => play("uk")}
          />
          <AudioButton
            label="US"
            available={entry.has_audio_us}
            active={playing === "us"}
            onPlay={() => play("us")}
          />
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Xoá ${entry.term}`}
            onClick={() => onRemove(note.id)}
          >
            ✕
          </Button>
        </div>
      </header>

      {entry.status === "ready" ? (
        <>
          {entry.meaning_vi && <p className="text-ink">{entry.meaning_vi}</p>}
          {entry.meaning_en && (
            <p className="text-sm text-ink-muted">{entry.meaning_en}</p>
          )}

          {entry.examples.length > 0 && (
            <ul className="flex flex-col gap-2 border-t border-border pt-3">
              {entry.examples.map((ex, i) => (
                <li key={i} className="text-sm">
                  <p className="text-ink-muted">{ex.text}</p>
                  {ex.translation_vi && (
                    <p className="text-ink-subtle">{ex.translation_vi}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : entry.status === "failed" ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-danger">Không tra được từ này.</p>
          {entry.error_message && (
            <p className="text-xs text-ink-subtle">{entry.error_message}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-sm text-ink-muted">Đang tra từ…</p>
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      )}

      {note.note && (
        <p className="rounded-md border border-border bg-surface-base/50 px-3 py-2 text-sm text-ink-muted">
          {note.note}
        </p>
      )}
    </article>
  );
}

function AudioButton({
  label,
  available,
  active,
  onPlay,
}: {
  label: string;
  available: boolean;
  active: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onPlay}
      // Disabled rather than hidden: the learner should see that a British
      // and an American reading exist, and that this one is not ready yet.
      title={available ? `Nghe giọng ${label}` : "Chưa có audio cho từ này"}
      aria-label={available ? `Nghe giọng ${label}` : `Audio ${label} chưa sẵn sàng`}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        available
          ? "border-border bg-surface-glass text-ink hover:border-border-strong"
          : "border-border bg-transparent text-ink-subtle opacity-40",
        active && "border-accent text-accent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden>{active ? "▶" : "🔊"}</span>
      {label}
    </button>
  );
}
