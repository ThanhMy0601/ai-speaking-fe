import { create } from "zustand";
import api from "../lib/api";
import type {
  CreateSessionResponse,
  SessionResponse,
  SessionsResponse,
  TranscriptResponse,
} from "../types/api";
import type { PracticeSession, TranscriptMessage } from "../types/domain";

interface PracticeState {
  sessions: PracticeSession[];
  currentSession: PracticeSession | null;
  livekitToken: string | null;
  livekitUrl: string | null;
  transcript: TranscriptMessage[];
  loading: boolean;
  createSession: (topicId?: number) => Promise<void>;
  endSession: (sessionId: number) => Promise<void>;
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

  createSession: async (topicId) => {
    set({ loading: true });
    try {
      const { data } = await api.post<CreateSessionResponse>("/practice_sessions", {
        session_type: "free_practice",
        metadata: topicId ? { topic_id: topicId } : undefined,
      });
      set({
        currentSession: data.practice_session,
        livekitToken: data.livekit_token,
        livekitUrl: data.livekit_url,
        transcript: [],
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // Optimistic: flips the session to "ending" for UX. The room_finished
  // webhook (or the stale-session sweep) is what actually completes it and
  // awards XP — a closed tab must never strand a session.
  endSession: async (sessionId) => {
    const { data } = await api.post<SessionResponse>(
      `/practice_sessions/${sessionId}/end`
    );
    set({ currentSession: data.practice_session });
  },

  fetchSessions: async (filters) => {
    set({ loading: true });
    try {
      const { data } = await api.get<SessionsResponse>("/practice_sessions", {
        params: filters,
      });
      set({ sessions: data.practice_sessions, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  fetchTranscript: async (sessionId) => {
    const { data } = await api.get<TranscriptResponse>(
      `/practice_sessions/${sessionId}/transcript`
    );
    set({ transcript: data.transcript.messages });
  },

  addTranscriptMessage: (msg) =>
    set((state) => ({ transcript: [...state.transcript, msg] })),
}));
