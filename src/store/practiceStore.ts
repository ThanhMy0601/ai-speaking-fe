import { create } from "zustand";
import api from "../lib/api";

interface PracticeSession {
  id: number;
  session_type: string;
  status: string;
  livekit_room_name: string;
  duration_seconds: number | null;
  overall_score: number | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

interface TranscriptMessage {
  index: number;
  speaker: "learner" | "ai";
  text: string;
  timestamp: string;
  pronunciation_score?: number;
}

interface PracticeState {
  sessions: PracticeSession[];
  currentSession: PracticeSession | null;
  livekitToken: string | null;
  livekitUrl: string | null;
  transcript: TranscriptMessage[];
  loading: boolean;
  createSession: (type: string, lessonId?: number) => Promise<void>;
  createIeltsMockTest: () => Promise<void>;
  createRolePlay: (scenario: string) => Promise<void>;
  fetchSessions: (filters?: Record<string, string>) => Promise<void>;
  fetchTranscript: (sessionId: number) => Promise<void>;
  addTranscriptMessage: (msg: TranscriptMessage) => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  sessions: [],
  currentSession: null,
  livekitToken: null,
  livekitUrl: null,
  transcript: [],
  loading: false,

  createSession: async (type, lessonId) => {
    set({ loading: true });
    const { data } = await api.post("/practice_sessions", {
      session_type: type,
      lesson_id: lessonId,
    });
    set({
      currentSession: data.practice_session,
      livekitToken: data.livekit_token,
      livekitUrl: data.livekit_url,
      transcript: [],
      loading: false,
    });
  },

  createIeltsMockTest: async () => {
    set({ loading: true });
    const { data } = await api.post("/ielts_mock_tests");
    set({
      currentSession: data.practice_session,
      livekitToken: data.livekit_token,
      livekitUrl: data.livekit_url,
      transcript: [],
      loading: false,
    });
  },

  createRolePlay: async (scenario) => {
    set({ loading: true });
    const { data } = await api.post("/role_play_sessions", { scenario });
    set({
      currentSession: data.practice_session,
      livekitToken: data.livekit_token,
      livekitUrl: data.livekit_url,
      transcript: [],
      loading: false,
    });
  },

  fetchSessions: async (filters) => {
    set({ loading: true });
    const { data } = await api.get("/practice_sessions", { params: filters });
    set({ sessions: data.practice_sessions, loading: false });
  },

  fetchTranscript: async (sessionId) => {
    const { data } = await api.get(`/practice_sessions/${sessionId}/transcript`);
    set({ transcript: data.transcript.messages });
  },

  addTranscriptMessage: (msg) =>
    set((state) => ({ transcript: [...state.transcript, msg] })),
}));
