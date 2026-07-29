import { create } from "zustand";
import api from "../lib/api";
import type {
  TopicCompleteResponse,
  TopicResponse,
  TopicsResponse,
} from "../types/api";
import type { Topic, TopicDetail } from "../types/domain";

export type { Topic };

interface TopicState {
  topics: Topic[];
  currentTopic: TopicDetail | null;
  loading: boolean;
  fetchTopics: () => Promise<void>;
  fetchTopic: (topicId: number) => Promise<void>;
  completeTopic: (topicId: number, sessionId?: number) => Promise<void>;
}

export const useTopicStore = create<TopicState>((set) => ({
  topics: [],
  currentTopic: null,
  loading: false,

  fetchTopics: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<TopicsResponse>("/topics");
      set({ topics: data.topics, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTopic: async (topicId) => {
    set({ loading: true });
    try {
      const { data } = await api.get<TopicResponse>(`/topics/${topicId}`);
      set({ currentTopic: data.topic, loading: false });
    } catch {
      set({ currentTopic: null, loading: false });
    }
  },

  completeTopic: async (topicId, sessionId) => {
    const { data } = await api.post<TopicCompleteResponse>(
      `/topics/${topicId}/complete`,
      { practice_session_id: sessionId }
    );

    // Topics are repeatable, so completing one bumps its attempt count
    // rather than flipping a permanent boolean.
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              completed: true,
              attempt_count: data.already_completed
                ? t.attempt_count
                : t.attempt_count + 1,
              last_practised_at: data.attempt.completed_at ?? t.last_practised_at,
            }
          : t
      ),
    }));
  },
}));
