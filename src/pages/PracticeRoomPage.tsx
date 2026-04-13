import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePracticeStore } from "../store/practiceStore";
import TranscriptPanel from "../components/TranscriptPanel";
import SessionControls from "../components/SessionControls";

const RECONNECT_DELAYS = [1000, 2000, 4000];

export default function PracticeRoomPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const {
    currentSession,
    livekitToken,
    livekitUrl,
    transcript,
    createSession,
    createIeltsMockTest,
    createRolePlay,
    loading,
  } = usePracticeStore();

  const [muted, setMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [scenario] = useState("job_interview");

  useEffect(() => {
    const initSession = async () => {
      try {
        if (type === "ielts") {
          await createIeltsMockTest();
        } else if (type === "roleplay") {
          await createRolePlay(scenario);
        } else {
          await createSession("free_practice");
        }
        setConnectionStatus("connected");
      } catch {
        setConnectionStatus("failed");
      }
    };
    initSession();
  }, [type]);

  const handleReconnect = useCallback(async () => {
    if (reconnectAttempt >= 3) {
      setConnectionStatus("failed");
      return;
    }
    setConnectionStatus("reconnecting");
    const delay = RECONNECT_DELAYS[reconnectAttempt] || 4000;
    await new Promise((r) => setTimeout(r, delay));
    setReconnectAttempt((prev) => prev + 1);
    try {
      setConnectionStatus("connected");
    } catch {
      if (reconnectAttempt + 1 >= 3) {
        setConnectionStatus("failed");
      }
    }
  }, [reconnectAttempt]);

  const handleEndSession = () => {
    navigate("/roadmap");
  };

  if (loading) return <div className="loading">Setting up practice room...</div>;

  return (
    <div className="practice-room-page">
      <header className="practice-header">
        <h1>
          {type === "ielts" && "IELTS Mock Test"}
          {type === "roleplay" && "Role Play Session"}
          {type === "free" && "Free Practice"}
        </h1>
        <span className={`connection-status status-${connectionStatus}`}>
          {connectionStatus === "reconnecting" && `Reconnecting... (${reconnectAttempt}/3)`}
          {connectionStatus === "connected" && "Connected"}
          {connectionStatus === "connecting" && "Connecting..."}
          {connectionStatus === "failed" && "Connection failed"}
        </span>
      </header>

      <div className="practice-layout">
        <div className="avatar-section">
          <div className="avatar-placeholder">
            <p>🤖 AI Avatar</p>
            <p className="avatar-note">
              TalkingHead.js + Ready Player Me avatar renders here
            </p>
            {livekitToken && (
              <p className="connection-info">
                Room: {currentSession?.livekit_room_name}<br />
                LiveKit URL: {livekitUrl}
              </p>
            )}
          </div>
        </div>

        <div className="transcript-section">
          <TranscriptPanel messages={transcript} />
        </div>
      </div>

      <SessionControls
        muted={muted}
        onToggleMute={() => setMuted(!muted)}
        onEndSession={handleEndSession}
        connectionStatus={connectionStatus}
        onReconnect={handleReconnect}
      />

      {connectionStatus === "failed" && (
        <div className="session-recovery" role="alert">
          <p>Connection lost. Your transcript has been saved.</p>
          <button onClick={() => navigate("/roadmap")}>Back to Roadmap</button>
          <button onClick={() => window.location.reload()}>Try New Session</button>
        </div>
      )}
    </div>
  );
}
