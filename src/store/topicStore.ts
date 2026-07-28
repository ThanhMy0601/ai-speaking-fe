import { create } from "zustand";
import api from "../lib/api";

export interface Topic {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient_from: string;
  gradient_to: string;
  sequence_order: number;
  completed: boolean;
}

interface TopicState {
  topics: Topic[];
  loading: boolean;
  fetchTopics: () => Promise<void>;
  completeTopic: (topicId: number, sessionId?: number) => Promise<void>;
  markCompleted: (topicId: number) => void;
}

export const useTopicStore = create<TopicState>((set) => ({
  topics: [],
  loading: false,

  fetchTopics: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/topics");
      set({ topics: data.topics, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  completeTopic: async (topicId, sessionId) => {
    await api.post(`/topics/${topicId}/complete`, {
      practice_session_id: sessionId,
    });
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId ? { ...t, completed: true } : t
      ),
    }));
  },

  markCompleted: (topicId) => {
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId ? { ...t, completed: true } : t
      ),
    }));
  },
}));
