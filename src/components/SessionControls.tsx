import Button from "./ui/Button";

interface Props {
  muted: boolean;
  onToggleMute: () => void;
  onEndSession: () => void;
  connectionStatus: string;
  onReconnect: () => void;
}

export default function SessionControls({
  muted,
  onToggleMute,
  onEndSession,
  connectionStatus,
  onReconnect,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        onClick={onToggleMute}
        variant={muted ? "danger" : "secondary"}
        aria-pressed={muted}
      >
        {muted ? "Unmute" : "Mute"}
      </Button>

      {connectionStatus === "failed" && (
        <Button onClick={onReconnect} variant="secondary">
          Reconnect
        </Button>
      )}

      <Button onClick={onEndSession} variant="primary">
        End session
      </Button>
    </div>
  );
}
