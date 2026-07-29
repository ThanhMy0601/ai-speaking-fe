import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePracticeStore } from "../store/practiceStore";
import { useTopicStore } from "../store/topicStore";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  DisconnectReason,
} from "livekit-client";
import TranscriptPanel from "../components/TranscriptPanel";
import SessionControls from "../components/SessionControls";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { cx } from "../lib/cx";

const RECONNECT_DELAYS = [1000, 2000, 4000];

export default function PracticeRoomPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    currentSession,
    livekitToken,
    livekitUrl,
    transcript,
    addTranscriptMessage,
    createSession,
    endSession,
  } = usePracticeStore();
  const { completeTopic } = useTopicStore();

  const topicId = searchParams.get("topic_id") ? Number(searchParams.get("topic_id")) : undefined;
  const topicTitle = searchParams.get("topic_title") ?? undefined;

  const [muted, setMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveSequenceRef = useRef(0);

  // 1. Create the practice session via API
  useEffect(() => {
    const initSession = async () => {
      try {
        await createSession(topicId);
      } catch {
        setConnectionStatus("failed");
      }
    };
    initSession();
  }, [topicId]);

  // 2. Connect to LiveKit room once we have a token
  useEffect(() => {
    if (!livekitToken || !livekitUrl) return;

    const room = new Room();
    roomRef.current = room;

    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, _pub: RemoteTrackPublication, _participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioEl = track.attach();
          audioEl.autoplay = true;
          audioEl.volume = 1.0;
          document.body.appendChild(audioEl);
          audioRef.current = audioEl;
        }
      }
    );

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach().forEach((el) => el.remove());
    });

    // Live transcript comes from LiveKit's native transcription events.
    // (The old DataReceived handler listened for payloads the agent never
    // sent, and captured a stale `transcript.length` for its keys.)
    room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
      for (const seg of segments) {
        if (seg.final) {
          const speaker =
            participant?.identity === room.localParticipant.identity
              ? ("learner" as const)
              : ("ai" as const);
          addTranscriptMessage({
            sequence: liveSequenceRef.current++,
            speaker,
            text: seg.text,
            spoke_started_at: new Date().toISOString(),
          });
        }
      }
    });

    room.on(RoomEvent.Connected, () => setConnectionStatus("connected"));
    room.on(RoomEvent.Reconnecting, () => setConnectionStatus("reconnecting"));
    room.on(RoomEvent.Reconnected, () => {
      setConnectionStatus("connected");
      setReconnectAttempt(0);
    });
    room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.CLIENT_INITIATED) return;
      setConnectionStatus("failed");
    });

    const connect = async () => {
      try {
        await room.connect(livekitUrl, livekitToken);
        await room.localParticipant.setMicrophoneEnabled(true);
        setConnectionStatus("connected");
      } catch (err) {
        console.error("Failed to connect to LiveKit:", err);
        setConnectionStatus("failed");
      }
    };

    connect();

    return () => {
      audioRef.current?.remove();
      room.disconnect();
      roomRef.current = null;
    };
  }, [livekitToken, livekitUrl]);

  // 3. Handle mute/unmute
  useEffect(() => {
    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setMicrophoneEnabled(!muted);
    }
  }, [muted]);

  const handleReconnect = useCallback(async () => {
    if (reconnectAttempt >= 3) {
      setConnectionStatus("failed");
      return;
    }
    setConnectionStatus("reconnecting");
    const delay = RECONNECT_DELAYS[reconnectAttempt] || 4000;
    await new Promise((r) => setTimeout(r, delay));
    setReconnectAttempt((prev) => prev + 1);

    if (roomRef.current && livekitToken && livekitUrl) {
      try {
        await roomRef.current.connect(livekitUrl, livekitToken);
        await roomRef.current.localParticipant.setMicrophoneEnabled(!muted);
        setConnectionStatus("connected");
      } catch {
        if (reconnectAttempt + 1 >= 3) setConnectionStatus("failed");
      }
    }
  }, [reconnectAttempt, livekitToken, livekitUrl, muted]);

  const handleEndSession = async () => {
    roomRef.current?.disconnect();
    setSessionEnded(true);

    if (currentSession) {
      // Optimistic "ending" for UX; the room_finished webhook (or the
      // stale-session sweep) is what actually completes the session and
      // awards XP server-side.
      try {
        await endSession(currentSession.id);
      } catch {
        // best-effort — the sweep will catch it
      }
    }

    // Immediate topic completion keeps the roadmap UI in sync; the server
    // path is idempotent, so the completion job finding it already done is
    // a no-op, never a double XP award.
    if (topicId && currentSession) {
      try {
        await completeTopic(topicId, currentSession.id);
      } catch {
        // best-effort
      }
    }

    navigate("/roadmap");
  };

  const sessionTitle = topicTitle ?? "Free practice";

  const STATUS_COPY: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
    connected: { label: "Connected", tone: "success" },
    connecting: { label: "Connecting…", tone: "neutral" },
    reconnecting: { label: `Reconnecting (${reconnectAttempt}/3)`, tone: "warning" },
    failed: { label: "Connection lost", tone: "danger" },
  };
  const status = STATUS_COPY[connectionStatus] ?? STATUS_COPY.connecting;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{sessionTitle}</h1>
          <p className="text-sm text-ink-subtle">
            Speak naturally — your tutor is listening.
          </p>
        </div>
        <Badge tone={status.tone}>
          <span
            aria-hidden
            className={cx(
              "size-1.5 rounded-full",
              status.tone === "success" ? "bg-success" : "bg-current"
            )}
            style={
              status.tone === "success"
                ? { animation: "pulse-dot 2s ease-in-out infinite" }
                : undefined
            }
          />
          {status.label}
        </Badge>
      </header>

      {/* Stacks on mobile; the old layout was a hard 1fr 1fr that squeezed
          the transcript to ~150px wide on a phone. */}
      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_minmax(20rem,26rem)]">
        <section className="relative grid min-h-64 place-items-center overflow-hidden rounded-lg border border-border bg-surface-glass">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(24rem 20rem at 50% 45%, rgb(109 94 248 / 0.22), transparent 65%)",
            }}
          />

          {/* Placeholder orb. Phase 7 replaces this with a real waveform
              driven by useMultibandTrackVolume — the visual state machine
              (listening / thinking / speaking) belongs with that work. */}
          <div className="relative flex flex-col items-center gap-4 text-center">
            <div
              className="grid size-28 place-items-center rounded-full bg-linear-135 from-accent to-accent-to text-4xl shadow-[0_0_60px_rgb(109_94_248/0.45)]"
              style={{ animation: "breathe 3.2s ease-in-out infinite" }}
              aria-hidden
            >
              🎙️
            </div>
            <div>
              <p className="font-medium text-ink">Your tutor</p>
              <p className="mt-0.5 text-sm text-ink-subtle">
                {connectionStatus === "connected"
                  ? "Just start talking"
                  : "Getting the room ready…"}
              </p>
            </div>
          </div>

          <style>{`
            @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
            @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
          `}</style>
        </section>

        <section className="min-h-64 overflow-hidden rounded-lg border border-border bg-surface-glass lg:max-h-[calc(100dvh-16rem)]">
          <TranscriptPanel messages={transcript} />
        </section>
      </div>

      <SessionControls
        muted={muted}
        onToggleMute={() => setMuted(!muted)}
        onEndSession={handleEndSession}
        connectionStatus={connectionStatus}
        onReconnect={handleReconnect}
      />

      {connectionStatus === "failed" && !sessionEnded && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-4 py-3"
        >
          {/* True: the agent persists each utterance as it happens. */}
          <p className="text-sm text-danger">
            Connection lost. Your conversation so far has been saved.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/roadmap")}>
              Back to topics
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
