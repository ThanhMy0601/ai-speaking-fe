import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Room, RoomEvent, DisconnectReason } from "livekit-client";
import { RoomContext, RoomAudioRenderer } from "@livekit/components-react";

import { usePracticeStore } from "../store/practiceStore";
import { useTopicStore } from "../store/topicStore";
import { useMicPermission } from "../hooks/useMicPermission";
import { useElapsed, formatClock } from "../hooks/useElapsed";

import VoiceStage from "../components/practice/VoiceStage";
import MicBlocked from "../components/practice/MicBlocked";
import SessionEnded from "../components/practice/SessionEnded";
import TranscriptPanel from "../components/TranscriptPanel";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";

type Connection = "idle" | "connecting" | "connected" | "reconnecting" | "failed";

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
  const { permission, request: requestMic } = useMicPermission();

  const topicId = searchParams.get("topic_id")
    ? Number(searchParams.get("topic_id"))
    : undefined;
  const topicTitle = searchParams.get("topic_title") ?? undefined;

  const [room, setRoom] = useState<Room | null>(null);
  const [connection, setConnection] = useState<Connection>("idle");
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedSessionId, setEndedSessionId] = useState<number | null>(null);

  const liveSequence = useRef(0);
  const sessionRequested = useRef(false);

  const elapsed = useElapsed(startedAt, connection === "connected" && !ended);

  // 1. Ask for the microphone before creating anything. A session that can
  //    never hear the learner is worse than no session.
  const micReady = permission === "granted";

  // 2. Create the practice session (which creates the LiveKit room and
  //    dispatches the agent) only once the mic is actually available.
  useEffect(() => {
    if (!micReady || sessionRequested.current) return;
    sessionRequested.current = true;

    setConnection("connecting");
    createSession(topicId).catch(() => setConnection("failed"));
  }, [micReady, topicId, createSession]);

  // 3. Connect. We construct and own the Room ourselves rather than using
  //    <LiveKitRoom>, which would take over the connection lifecycle; the
  //    hooks only need it provided through RoomContext.
  useEffect(() => {
    if (!livekitToken || !livekitUrl) return;

    const next = new Room();
    setRoom(next);

    next.on(RoomEvent.Connected, () => {
      setConnection("connected");
      setStartedAt((prev) => prev ?? Date.now());
    });
    // The SDK reconnects with its own exponential backoff. The hand-rolled
    // RECONNECT_DELAYS this replaces called .connect() on a Room that had
    // already terminally disconnected, which cannot work — a terminal
    // disconnect needs a fresh Room and a fresh token.
    next.on(RoomEvent.Reconnecting, () => setConnection("reconnecting"));
    next.on(RoomEvent.Reconnected, () => setConnection("connected"));
    next.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.CLIENT_INITIATED) return;
      setConnection("failed");
    });

    next.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
      for (const seg of segments) {
        if (!seg.final) continue;
        addTranscriptMessage({
          sequence: liveSequence.current++,
          speaker:
            participant?.identity === next.localParticipant.identity ? "learner" : "ai",
          text: seg.text,
          spoke_started_at: new Date().toISOString(),
        });
      }
    });

    let cancelled = false;
    (async () => {
      try {
        await next.connect(livekitUrl, livekitToken);
        if (cancelled) return;
        await next.localParticipant.setMicrophoneEnabled(true);
      } catch {
        if (!cancelled) setConnection("failed");
      }
    })();

    return () => {
      cancelled = true;
      next.disconnect();
      setRoom(null);
    };
  }, [livekitToken, livekitUrl, addTranscriptMessage]);

  const toggleMute = useCallback(() => {
    if (!room) return;
    const next = !muted;
    setMuted(next);
    room.localParticipant.setMicrophoneEnabled(!next);
  }, [room, muted]);

  const handleEnd = useCallback(async () => {
    const session = currentSession;
    room?.disconnect();
    setEnded(true);
    setEndedSessionId(session?.id ?? null);

    if (session) {
      // Optimistic only. The room_finished webhook (or the hourly sweep) is
      // what actually completes the session server-side, so closing the tab
      // instead of clicking this still works.
      try {
        await endSession(session.id);
      } catch {
        /* the sweep will catch it */
      }
    }
    if (topicId && session) {
      try {
        await completeTopic(topicId, session.id);
      } catch {
        /* idempotent server-side; safe to lose */
      }
    }
  }, [room, currentSession, endSession, completeTopic, topicId]);

  const restart = useCallback(() => window.location.reload(), []);

  const status = useMemo(() => {
    switch (connection) {
      case "connected":
        return { label: "Connected", tone: "success" as const };
      case "reconnecting":
        return { label: "Reconnecting…", tone: "warning" as const };
      case "failed":
        return { label: "Connection lost", tone: "danger" as const };
      default:
        return { label: "Connecting…", tone: "neutral" as const };
    }
  }, [connection]);

  // --- Screens ------------------------------------------------------------

  if (permission === "checking") {
    return (
      <div className="grid min-h-[60dvh] place-items-center">
        <Spinner size={28} label="Checking microphone" />
      </div>
    );
  }

  if (permission !== "granted") {
    return <MicBlocked permission={permission} onRequest={requestMic} />;
  }

  if (ended) {
    return (
      <SessionEnded
        sessionId={endedSessionId}
        topicTitle={topicTitle}
        durationSeconds={elapsed}
        turnCount={transcript.length}
        onPractiseAgain={restart}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-4">
      {connection === "reconnecting" && (
        // A banner, not a layout swap — the transcript has to stay readable
        // while the connection recovers.
        <div
          role="status"
          className="rounded-md border border-[rgb(251_191_36/0.3)] bg-warning-dim px-4 py-2.5 text-sm text-warning"
        >
          Connection dropped — reconnecting. Your conversation is saved.
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">
            {topicTitle ?? "Free practice"}
          </h1>
          {/* The internal LiveKit room name used to be printed here. */}
          <p className="text-sm text-ink-subtle tabular-nums">
            {connection === "connected" ? formatClock(elapsed) : "Not started"}
          </p>
        </div>
        <Badge tone={status.tone}>
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-current"
            style={
              status.tone === "success"
                ? { animation: "pulse-dot 2s ease-in-out infinite" }
                : undefined
            }
          />
          {status.label}
        </Badge>
      </header>

      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_minmax(20rem,26rem)]">
        {room ? (
          <RoomContext.Provider value={room}>
            {/* Replaces a manual track.attach() + document.body.appendChild,
                which leaked every audio element except the last. */}
            <RoomAudioRenderer />
            <VoiceStage onRetry={restart} />
          </RoomContext.Provider>
        ) : (
          <div className="grid flex-1 place-items-center rounded-lg border border-border bg-surface-glass">
            <div className="flex flex-col items-center gap-3">
              <Spinner size={24} />
              <p className="text-sm text-ink-subtle">Setting up your room…</p>
            </div>
          </div>
        )}

        <section className="min-h-64 overflow-hidden rounded-lg border border-border bg-surface-glass lg:max-h-[calc(100dvh-14rem)]">
          <TranscriptPanel messages={transcript} />
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={toggleMute} variant={muted ? "danger" : "secondary"} aria-pressed={muted}>
          {muted ? "Unmute" : "Mute"}
        </Button>
        {connection === "failed" && (
          <Button onClick={restart} variant="secondary">
            Reconnect
          </Button>
        )}
        <Button onClick={handleEnd} variant="primary">
          End session
        </Button>
      </div>

      {connection === "failed" && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-4 py-3"
        >
          <p className="text-sm text-danger">
            Connection lost. Everything you said so far has been saved.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/roadmap")}>
              Back to topics
            </Button>
            <Button variant="secondary" onClick={restart}>
              Try again
            </Button>
          </div>
        </div>
      )}

      <style>{"@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.35}}"}</style>
    </div>
  );
}
