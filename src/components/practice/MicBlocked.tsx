import { Link } from "react-router-dom";
import Button from "../ui/Button";
import type { MicPermission } from "../../hooks/useMicPermission";

interface Props {
  permission: MicPermission;
  onRequest: () => Promise<boolean>;
}

// Where the setting actually lives differs enough per browser that "check
// your settings" is useless advice.
function instructions(): string {
  const ua = navigator.userAgent;
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    return "Click the icon at the left of the address bar, then allow the microphone.";
  }
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    return "Open Safari → Settings for This Website, then set Microphone to Allow.";
  }
  if (/Firefox\//.test(ua)) {
    return "Click the microphone icon in the address bar and remove the block.";
  }
  return "Open your browser's site settings and allow microphone access.";
}

export default function MicBlocked({ permission, onRequest }: Props) {
  const unsupported = permission === "unsupported";

  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-danger-dim text-2xl" aria-hidden>
          🎙️
        </span>

        <div>
          <h1 className="text-xl font-semibold">
            {unsupported ? "This browser can't record audio" : "Microphone access needed"}
          </h1>
          <p className="mt-2 text-ink-muted">
            {unsupported
              ? "Speaking practice needs microphone access. Try Chrome, Safari or Firefox on a device with a microphone."
              : permission === "denied"
                ? `Your browser is blocking the microphone for this site. ${instructions()}`
                : "We need your microphone so your tutor can hear you. Nothing is recorded until a session starts."}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {!unsupported && (
            <Button variant="primary" onClick={onRequest}>
              {permission === "denied" ? "Try again" : "Allow microphone"}
            </Button>
          )}
          <Link to="/roadmap">
            <Button variant="ghost">Back to topics</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
