import { create } from "zustand";
import api from "../lib/api";
import type {
  AdminTopicLevel,
  AdminTopicLevelResponse,
  AdminTopicResponse,
  AdminTopicsResponse,
} from "../types/api";
import type { AdminTopic } from "../types/domain";

export type AdminTopicDetail = AdminTopic & { levels: AdminTopicLevel[] };

/** Everything the topic form can write. Partial: PATCH sends only changes. */
export type TopicDraft = Partial<
  Pick<
    AdminTopic,
    | "title"
    | "description"
    | "icon"
    | "color"
    | "gradient_from"
    | "gradient_to"
    | "cefr_level"
    | "estimated_minutes"
    | "active"
    | "conversation_guide"
    | "opening_line"
    | "target_vocabulary"
    | "target_grammar"
  >
>;

export type LevelDraft = Partial<
  Pick<
    AdminTopicLevel,
    | "level"
    | "title"
    | "conversation_guide"
    | "opening_line"
    | "active"
    | "target_vocabulary"
    | "target_grammar"
  >
>;

interface AdminTopicState {
  topics: AdminTopic[];
  current: AdminTopicDetail | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchTopics: () => Promise<void>;
  fetchTopic: (id: number) => Promise<void>;
  clearCurrent: () => void;
  createTopic: (draft: TopicDraft) => Promise<AdminTopic>;
  updateTopic: (id: number, draft: TopicDraft) => Promise<void>;
  deleteTopic: (id: number) => Promise<void>;
  reorder: (ids: number[]) => Promise<void>;
  createLevel: (topicId: number, draft: LevelDraft) => Promise<void>;
  updateLevel: (levelId: number, draft: LevelDraft) => Promise<void>;
  deleteLevel: (levelId: number) => Promise<void>;
}

function message(e: unknown, fallback: string): string {
  const res = (e as { response?: { data?: { error?: string; errors?: { message: string }[] } } })
    .response;
  return res?.data?.errors?.map((x) => x.message).join(", ") || res?.data?.error || fallback;
}

export const useAdminTopicStore = create<AdminTopicState>((set, get) => ({
  topics: [],
  current: null,
  loading: false,
  saving: false,
  error: null,

  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<AdminTopicsResponse>("/admin/topics");
      set({ topics: data.topics, loading: false });
    } catch (e) {
      set({ loading: false, error: message(e, "Không tải được danh sách chủ đề") });
    }
  },

  fetchTopic: async (id) => {
    set({ loading: true, error: null, current: null });
    try {
      const { data } = await api.get<AdminTopicResponse>(`/admin/topics/${id}`);
      set({ current: data.topic, loading: false });
    } catch (e) {
      set({ loading: false, error: message(e, "Không tải được chủ đề") });
    }
  },

  clearCurrent: () => set({ current: null, error: null }),

  createTopic: async (draft) => {
    set({ saving: true, error: null });
    try {
      const { data } = await api.post<AdminTopicResponse>("/admin/topics", draft);
      set((s) => ({ topics: [...s.topics, data.topic], saving: false }));
      return data.topic;
    } catch (e) {
      set({ saving: false, error: message(e, "Không tạo được chủ đề") });
      throw e;
    }
  },

  updateTopic: async (id, draft) => {
    set({ saving: true, error: null });
    try {
      const { data } = await api.patch<AdminTopicResponse>(`/admin/topics/${id}`, draft);
      set((s) => ({
        saving: false,
        topics: s.topics.map((t) => (t.id === id ? data.topic : t)),
        current: s.current?.id === id ? { ...s.current, ...data.topic } : s.current,
      }));
    } catch (e) {
      set({ saving: false, error: message(e, "Không lưu được chủ đề") });
      throw e;
    }
  },

  /**
   * Rejected with 422 when the topic has practice history — the server
   * refuses rather than cascading a delete through a learner's recorded
   * conversations. Callers should keep the confirm dialog open and show
   * `error`.
   */
  deleteTopic: async (id) => {
    set({ saving: true, error: null });
    try {
      await api.delete(`/admin/topics/${id}`);
      set((s) => ({ saving: false, topics: s.topics.filter((t) => t.id !== id) }));
    } catch (e) {
      set({ saving: false, error: message(e, "Không xoá được chủ đề") });
      throw e;
    }
  },

  /**
   * Sends the whole order in one request.
   *
   * sequence_order carries a UNIQUE index, so PATCHing topics one at a time
   * collides the moment two of them swap. The server writes to a temporary
   * offset band and then to the final values inside a single transaction —
   * that only works if it sees the complete list.
   */
  reorder: async (ids) => {
    const previous = get().topics;
    // Optimistic: the drag already moved the row visually, so reordering
    // state here just keeps it there while the request is in flight.
    const byId = new Map(previous.map((t) => [t.id, t]));
    set({
      topics: ids.map((id) => byId.get(id)).filter((t): t is AdminTopic => t !== undefined),
      error: null,
    });

    try {
      const { data } = await api.post<AdminTopicsResponse>("/admin/topics/reorder", {
        topic_ids: ids,
      });
      set({ topics: data.topics });
    } catch (e) {
      // Put the old order back rather than leaving the UI showing an order
      // the database does not have.
      set({ topics: previous, error: message(e, "Không lưu được thứ tự") });
      throw e;
    }
  },

  createLevel: async (topicId, draft) => {
    const { data } = await api.post<AdminTopicLevelResponse>(
      `/admin/topics/${topicId}/levels`,
      draft
    );
    set((s) =>
      s.current
        ? { current: { ...s.current, levels: [...s.current.levels, data.level] } }
        : {}
    );
  },

  updateLevel: async (levelId, draft) => {
    const { data } = await api.patch<AdminTopicLevelResponse>(
      `/admin/levels/${levelId}`,
      draft
    );
    set((s) =>
      s.current
        ? {
            current: {
              ...s.current,
              levels: s.current.levels.map((l) => (l.id === levelId ? data.level : l)),
            },
          }
        : {}
    );
  },

  deleteLevel: async (levelId) => {
    await api.delete(`/admin/levels/${levelId}`);
    set((s) =>
      s.current
        ? { current: { ...s.current, levels: s.current.levels.filter((l) => l.id !== levelId) } }
        : {}
    );
  },
}));
