import { useCallback, useEffect, useState } from "react";

export type MicPermission = "checking" | "granted" | "denied" | "prompt" | "unsupported";

/**
 * Microphone permission, checked before we bother connecting.
 *
 * Previously a denied microphone just produced a console.error and dropped
 * the learner into a room where nobody could hear them and nothing said why.
 */
export function useMicPermission() {
  const [permission, setPermission] = useState<MicPermission>("checking");

  const request = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release it immediately — LiveKit opens its own capture. Holding this
      // one leaves the browser's recording indicator on for the whole session.
      stream.getTracks().forEach((t) => t.stop());
      setPermission("granted");
      return true;
    } catch {
      setPermission("denied");
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return;
    }

    // Firefox and older Safari don't expose the microphone descriptor to
    // the Permissions API, so a throw here means "we can't know yet", not
    // "denied" — fall through to prompt and let getUserMedia decide.
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setPermission(status.state as MicPermission);
        status.onchange = () => {
          if (!cancelled) setPermission(status.state as MicPermission);
        };
      })
      .catch(() => {
        if (!cancelled) setPermission("prompt");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { permission, request };
}
