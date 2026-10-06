import { create } from "zustand";
import api from "../lib/api";
import type { VocabularyNoteResponse, VocabularyNotesResponse } from "../types/api";
import type { VocabularyNote } from "../types/domain";

/** Statuses that will never change on their own — stop polling once all are here. */
const SETTLED = new Set(["ready", "failed"]);

interface VocabularyState {
  notes: VocabularyNote[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  addWord: (term: string, note?: string) => Promise<void>;
  updateNote: (id: number, note: string) => Promise<void>;
  removeNote: (id: number) => Promise<void>;
  hasPending: () => boolean;
  clearError: () => void;
}

function message(e: unknown, fallback: string): string {
  const res = (e as { response?: { data?: { error?: string } } }).response;
  return res?.data?.error || fallback;
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  notes: [],
  loading: false,
  saving: false,
  error: null,

  clearError: () => set({ error: null }),

  /** True while any card is still being looked up, so the page knows to poll. */
  hasPending: () => get().notes.some((n) => !SETTLED.has(n.entry.status)),

  fetchNotes: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<VocabularyNotesResponse>("/vocabulary_notes");
      set({ notes: data.notes, loading: false });
    } catch (e) {
      set({ loading: false, error: message(e, "Không tải được sổ từ vựng") });
    }
  },

  addWord: async (term, note) => {
    set({ saving: true, error: null });
    try {
      const { data } = await api.post<VocabularyNoteResponse>("/vocabulary_notes", {
        term,
        note,
      });
      set((s) => ({
        saving: false,
        // Saving a word already on the shelf returns the existing note rather
        // than erroring, so replace in place instead of appending a duplicate.
        notes: [data.note, ...s.notes.filter((n) => n.id !== data.note.id)],
      }));
    } catch (e) {
      set({ saving: false, error: message(e, "Không lưu được từ này") });
      throw e;
    }
  },

  updateNote: async (id, note) => {
    const { data } = await api.patch<VocabularyNoteResponse>(`/vocabulary_notes/${id}`, {
      note,
    });
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? data.note : n)) }));
  },

  removeNote: async (id) => {
    await api.delete(`/vocabulary_notes/${id}`);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },
}));
