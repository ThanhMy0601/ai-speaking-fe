import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { formatClock } from "../../hooks/useElapsed";
import { cx } from "../../lib/cx";

export interface AudioPlayerHandle {
  /** Seek to a position in milliseconds and start playing. */
  seekTo: (ms: number) => void;
}

interface Props {
  url: string;
  /** Server-reported length, used before metadata loads. */
  durationMs?: number | null;
  onTimeUpdate?: (ms: number) => void;
  /** Called when playback fails, usually because the presigned URL expired. */
  onExpired?: () => Promise<unknown>;
}

const SKIP_SECONDS = 10;

const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(function AudioPlayer(
  { url, durationMs, onTimeUpdate, onExpired },
  ref
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState((durationMs ?? 0) / 1000);
  const [error, setError] = useState(false);
  const retried = useRef(false);

  useImperativeHandle(ref, () => ({
    seekTo(ms: number) {
      const audio = audioRef.current;
      if (!audio) return;
      // Offsets can be negative: a learner can start talking before the
      // egress worker has spun up, so the utterance genuinely precedes the
      // file. Clamp rather than treat it as invalid.
      audio.currentTime = Math.max(0, ms / 1000);
      void audio.play().catch(() => undefined);
    },
  }));

  const handleError = useCallback(async () => {
    // Presigned URLs last 15 minutes. A report left open in a tab will fail
    // here; ask for a fresh link once before giving up.
    if (retried.current || !onExpired) {
      setError(true);
      return;
    }
    retried.current = true;
    const refreshed = await onExpired();
    if (!refreshed) setError(true);
  }, [onExpired]);

  useEffect(() => {
    retried.current = false;
    setError(false);
  }, [url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + seconds), duration || audio.duration || 0);
  };

  const scrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  if (error) {
    return (
      <div className="rounded-md border border-border bg-surface-glass px-4 py-3.5 text-sm text-ink-muted">
        This recording couldn't be loaded. Try reloading the page.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface-glass p-4">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrent(t);
          onTimeUpdate?.(t * 1000);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={handleError}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-linear-135 from-accent to-accent-to text-accent-ink shadow-[var(--glow-accent)] transition-transform active:scale-95"
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => skip(-SKIP_SECONDS)}
          aria-label={`Back ${SKIP_SECONDS} seconds`}
          className="shrink-0 rounded-sm px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          −{SKIP_SECONDS}s
        </button>
        <button
          onClick={() => skip(SKIP_SECONDS)}
          aria-label={`Forward ${SKIP_SECONDS} seconds`}
          className="shrink-0 rounded-sm px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          +{SKIP_SECONDS}s
        </button>

        <div className="relative flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-accent to-accent-to"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={scrub}
            aria-label="Seek"
            className={cx(
              "absolute inset-0 h-full w-full cursor-pointer opacity-0",
              "focus-visible:opacity-100 focus-visible:accent-[var(--color-accent)]"
            )}
          />
        </div>

        <span className="shrink-0 text-xs text-ink-subtle tabular-nums">
          {formatClock(Math.floor(current))} / {formatClock(Math.floor(duration))}
        </span>
      </div>
    </div>
  );
});

export default AudioPlayer;
