import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePracticeStore } from "../store/practiceStore";
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

const RECONNECT_DELAYS = [1000, 2000, 4000];

export default function PracticeRoomPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const {
    currentSession,
    livekitToken,
    livekitUrl,
    transcript,
    addTranscriptMessage,
    createSession,
    createIeltsMockTest,
    createRolePlay,
    loading,
  } = usePracticeStore();

  const [muted, setMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [scenario] = useState("job_interview");
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Create the practice session via API
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
      } catch {
        setConnectionStatus("failed");
      }
    };
    initSession();
  }, [type]);

  // 2. Connect to LiveKit room once we have a token
  useEffect(() => {
    if (!livekitToken || !livekitUrl) return;

    const room = new Room();
    roomRef.current = room;

    // Handle remote audio tracks (agent's voice)
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

    room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack) => {
        track.detach().forEach((el) => el.remove());
      }
    );

    // Handle agent transcript data messages
    room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === "transcript" || data.speaker) {
          addTranscriptMessage({
            index: transcript.length,
            speaker: data.speaker || "ai",
            text: data.text || data.content || "",
            timestamp: new Date().toISOString(),
            pronunciation_score: data.pronunciation_score,
          });
        }
      } catch {
        // Not JSON data, ignore
      }
    });

    // Handle transcription events from LiveKit agents
    room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
      for (const seg of segments) {
        if (seg.final) {
          const speaker = participant?.identity === room.localParticipant.identity
            ? "learner" as const
            : "ai" as const;
          addTranscriptMessage({
            index: Date.now(),
            speaker,
            text: seg.text,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    room.on(RoomEvent.Connected, () => {
      setConnectionStatus("connected");
    });

    room.on(RoomEvent.Reconnecting, () => {
      setConnectionStatus("reconnecting");
    });

    room.on(RoomEvent.Reconnected, () => {
      setConnectionStatus("connected");
      setReconnectAttempt(0);
    });

    room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.CLIENT_INITIATED) return;
      setConnectionStatus("failed");
    });

    // Connect to the room
    const connect = async () => {
      try {
        await room.connect(livekitUrl, livekitToken);
        // Publish microphone
        await room.localParticipant.setMicrophoneEnabled(true);
        setConnectionStatus("connected");
      } catch (err) {
        console.error("Failed to connect to LiveKit:", err);
        setConnectionStatus("failed");
      }
    };

    connect();

    // Cleanup on unmount
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
        if (reconnectAttempt + 1 >= 3) {
          setConnectionStatus("failed");
        }
      }
    }
  }, [reconnectAttempt, livekitToken, livekitUrl, muted]);

  const handleEndSession = () => {
    roomRef.current?.disconnect();
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
            {currentSession && (
              <p className="connection-info">
                Room: {currentSession.livekit_room_name}
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
