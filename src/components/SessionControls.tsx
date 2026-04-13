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
    <div className="session-controls" role="toolbar" aria-label="Session controls">
      <button
        onClick={onToggleMute}
        className={`control-btn ${muted ? "muted" : ""}`}
        aria-label={muted ? "Unmute microphone" : "Mute microphone"}
      >
        {muted ? "🔇 Unmute" : "🎤 Mute"}
      </button>

      {connectionStatus === "failed" && (
        <button onClick={onReconnect} className="control-btn reconnect-btn">
          🔄 Reconnect
        </button>
      )}

      <button onClick={onEndSession} className="control-btn end-btn" aria-label="End session">
        ⏹ End Session
      </button>
    </div>
  );
}
