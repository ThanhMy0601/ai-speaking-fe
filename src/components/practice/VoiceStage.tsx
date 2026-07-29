import { useEffect, useRef, useState } from "react";
import {
  useVoiceAssistant,
  useMultibandTrackVolume,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import type { LocalAudioTrack } from "livekit-client";
import VoiceOrb from "./VoiceOrb";
import Button from "../ui/Button";

interface Props {
  onRetry: () => void;
}

// The agent can genuinely take a few seconds to think. These are the points
// at which silence stops being "working" and starts being "stuck" — the old
// room had no timeout UX anywhere, so a stalled model looked identical to a
// working one, forever.
const THINKING_SLOW_MS = 8_000;
const THINKING_STUCK_MS = 20_000;
const AGENT_JOIN_SLOW_MS = 10_000;
const AGENT_JOIN_STUCK_MS = 25_000;

// Hysteresis on the "learner is talking" threshold, so the label doesn't
// strobe between states on the gaps between words.
const SPEAK_ON = 0.055;
const SPEAK_OFF = 0.03;

function useStalled(active: boolean, slowMs: number, stuckMs: number) {
  const [level, setLevel] = useState<"ok" | "slow" | "stuck">("ok");

  useEffect(() => {
    if (!active) {
      setLevel("ok");
      return;
    }
    const slow = setTimeout(() => setLevel("slow"), slowMs);
    const stuck = setTimeout(() => setLevel("stuck"), stuckMs);
    return () => {
      clearTimeout(slow);
      clearTimeout(stuck);
    };
  }, [active, slowMs, stuckMs]);

  return level;
}

export default function VoiceStage({ onRetry }: Props) {
  // `state` is derived from participant attributes the agent publishes, so
  // "is the tutor thinking?" comes from the agent itself rather than being
  // guessed from raw Room events.
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();

  const micTrack = localParticipant
    .getTrackPublication(Track.Source.Microphone)
    ?.track as LocalAudioTrack | undefined;

  const agentBands = useMultibandTrackVolume(audioTrack, { bands: 24 });
  const learnerBands = useMultibandTrackVolume(micTrack, { bands: 24 });

  const learnerLevel = learnerBands.length
    ? learnerBands.reduce((a, b) => a + b, 0) / learnerBands.length
    : 0;

  const [learnerSpeaking, setLearnerSpeaking] = useState(false);
  const speakingRef = useRef(false);
  useEffect(() => {
    if (!speakingRef.current && learnerLevel > SPEAK_ON) {
      speakingRef.current = true;
      setLearnerSpeaking(true);
    } else if (speakingRef.current && learnerLevel < SPEAK_OFF) {
      speakingRef.current = false;
      setLearnerSpeaking(false);
    }
  }, [learnerLevel]);

  const thinkingStall = useStalled(state === "thinking", THINKING_SLOW_MS, THINKING_STUCK_MS);
  // "initializing" means the room is up and the agent worker has not
  // arrived. Kept distinct from "connecting" on purpose: a dead agent used
  // to be indistinguishable from a dead network.
  const joinStall = useStalled(
    state === "initializing" || state === "connecting",
    AGENT_JOIN_SLOW_MS,
    AGENT_JOIN_STUCK_MS
  );

  const showLearner = learnerSpeaking && state !== "speaking" && state !== "thinking";
  const mode = showLearner ? "user-speaking" : state;
  const bands = showLearner ? learnerBands : state === "speaking" ? agentBands : learnerBands;

  const caption = (() => {
    if (state === "connecting") return "Setting up your room…";
    if (state === "initializing") {
      if (joinStall === "stuck") return "Your tutor isn't responding";
      if (joinStall === "slow") return "Taking longer than usual…";
      return "Your tutor is joining…";
    }
    if (state === "thinking") {
      if (thinkingStall === "stuck") return "Your tutor seems stuck";
      if (thinkingStall === "slow") return "Still thinking…";
      return "Thinking…";
    }
    if (state === "speaking") return "Your tutor is speaking";
    if (state === "failed") return "Something went wrong";
    if (state === "disconnected") return "Disconnected";
    if (showLearner) return "Listening…";
    return "Just start talking";
  })();

  const stuck = thinkingStall === "stuck" || joinStall === "stuck";

  return (
    <div className="relative grid flex-1 place-items-center overflow-hidden rounded-lg border border-border bg-surface-glass">
      <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
        <VoiceOrb mode={mode} bands={bands} />

        <div className="flex min-h-14 flex-col items-center gap-1">
          <p
            className="text-lg font-medium text-ink"
            role="status"
            aria-live="polite"
          >
            {caption}
          </p>
          {state === "listening" && !showLearner && (
            <p className="text-sm text-ink-subtle">
              You can interrupt any time — just speak.
            </p>
          )}
        </div>

        {stuck && (
          <Button variant="secondary" onClick={onRetry}>
            Restart the session
          </Button>
        )}
      </div>
    </div>
  );
}
