import { useEffect, useRef } from "react";
import type { AgentState } from "@livekit/components-react";

export type OrbMode = AgentState | "user-speaking";

interface Props {
  mode: OrbMode;
  /** Per-band amplitudes, 0..1, from useMultibandTrackVolume. */
  bands: number[];
  size?: number;
}

// Accent gradient, matched to --color-accent / --color-accent-to.
const ACCENT: [number, number, number] = [109, 94, 248];
const CYAN: [number, number, number] = [34, 211, 238];
const GREEN: [number, number, number] = [74, 222, 128];
const GREY: [number, number, number] = [107, 118, 153];

function paletteFor(mode: OrbMode): [number[], number[]] {
  switch (mode) {
    case "user-speaking":
      // The learner's own voice reads back in green — it is their turn, and
      // it should look unmistakably different from the tutor's.
      return [GREEN, CYAN];
    case "speaking":
      return [ACCENT, CYAN];
    case "thinking":
      return [ACCENT, ACCENT];
    case "failed":
    case "disconnected":
      return [GREY, GREY];
    default:
      return [ACCENT, CYAN];
  }
}

function rgba(c: number[], a: number) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/**
 * The room's focal point: a breathing orb ringed by a live waveform.
 *
 * Canvas 2D rather than WebGL — this needs no Suspense boundary, no GPU
 * fallback path and no separate reduced-motion implementation, and it
 * replaced 1.1MB of three.js that was never imported.
 */
export default function VoiceOrb({ mode, bands, size = 260 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read through refs so the animation loop is started once, not on every
  // volume sample — bands update ~60x/second.
  const bandsRef = useRef(bands);
  const modeRef = useRef(mode);
  bandsRef.current = bands;
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centre = size / 2;
    const baseRadius = size * 0.24;
    // Smoothed copies so a spiky FFT frame doesn't make the ring jitter.
    let smoothed: number[] = [];
    let frame = 0;
    let raf = 0;

    const draw = () => {
      const m = modeRef.current;
      const raw = bandsRef.current;
      const [from, to] = paletteFor(m);
      frame += 1;

      ctx.clearRect(0, 0, size, size);

      if (smoothed.length !== raw.length) smoothed = raw.slice();
      // Exponential smoothing: fast to rise, slower to fall, so speech
      // reads as energetic without the ring flickering between syllables.
      for (let i = 0; i < raw.length; i++) {
        const target = raw[i] ?? 0;
        const k = target > smoothed[i] ? 0.45 : 0.12;
        smoothed[i] += (target - smoothed[i]) * k;
      }

      const level = smoothed.length
        ? Math.min(1, smoothed.reduce((a, b) => a + b, 0) / smoothed.length * 3.2)
        : 0;

      const breath = reduced ? 0 : Math.sin(frame / 42) * 0.035;
      const idle = m === "listening" || m === "initializing" || m === "connecting";
      const scale = 1 + breath + (idle ? 0 : level * 0.16);
      const radius = baseRadius * scale;

      // Outer bloom.
      const bloom = ctx.createRadialGradient(centre, centre, radius * 0.5, centre, centre, size * 0.5);
      bloom.addColorStop(0, rgba(from, 0.28 + level * 0.3));
      bloom.addColorStop(0.55, rgba(to, 0.08));
      bloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, size, size);

      // Waveform ring. "thinking" replaces it with a sweeping arc, because
      // there is no audio to visualise and a frozen ring looks like a hang.
      if (m === "thinking") {
        const sweep = (frame / 26) % (Math.PI * 2);
        ctx.strokeStyle = rgba(from, 0.9);
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(centre, centre, radius * 1.5, sweep, sweep + Math.PI * 0.5);
        ctx.stroke();
      } else if (smoothed.length) {
        const count = smoothed.length;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const amp = Math.min(1, smoothed[i] * 3.4);
          const inner = radius * 1.32;
          const outer = inner + amp * size * 0.14 + 2;

          const grad = ctx.createLinearGradient(
            centre + Math.cos(angle) * inner,
            centre + Math.sin(angle) * inner,
            centre + Math.cos(angle) * outer,
            centre + Math.sin(angle) * outer
          );
          grad.addColorStop(0, rgba(from, 0.85));
          grad.addColorStop(1, rgba(to, 0.25));

          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(2, size * 0.011);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(centre + Math.cos(angle) * inner, centre + Math.sin(angle) * inner);
          ctx.lineTo(centre + Math.cos(angle) * outer, centre + Math.sin(angle) * outer);
          ctx.stroke();
        }
      }

      // Core.
      const core = ctx.createRadialGradient(
        centre - radius * 0.3,
        centre - radius * 0.35,
        radius * 0.1,
        centre,
        centre,
        radius
      );
      core.addColorStop(0, rgba(to, 0.95));
      core.addColorStop(0.6, rgba(from, 0.95));
      core.addColorStop(1, rgba(from, 0.75));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(centre, centre, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      aria-hidden
      className="pointer-events-none select-none"
    />
  );
}
