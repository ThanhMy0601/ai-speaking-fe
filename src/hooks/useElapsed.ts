import { useEffect, useState } from "react";

/** Seconds elapsed since `startedAt`, ticking once a second while `running`. */
export function useElapsed(startedAt: number | null, running: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt || !running) return;

    const tick = () => setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, running]);

  return seconds;
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
