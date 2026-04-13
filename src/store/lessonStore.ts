import { create } from "zustand";
import api from "../lib/api";

interface LessonNode {
  id: number;
  title: string;
  position: number;
  status: "locked" | "unlocked" | "in_progress" | "completed";
  estimated_duration_minutes: number;
}

interface LessonPath {
  id: number;
  title: string;
  goal_type: string;
  proficiency_level: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

interface LessonDetail {
  id: number;
  title: string;
  description: string;
  stages: { stage: string; data: Record<string, unknown> }[];
  vocabulary_items: VocabularyItem[];
  estimated_duration_minutes: number;
}

interface VocabularyItem {
  id: number;
  word: string;
  phonetic: string;
  definition: string;
  example_sentence: string;
  audio_url: string;
}

interface LessonState {
  paths: LessonPath[];
  currentPath: LessonPath | null;
  lessons: LessonNode[];
  currentLesson: LessonDetail | null;
  loading: boolean;
  fetchPaths: () => Promise<void>;
  fetchPath: (id: number) => Promise<void>;
  fetchLesson: (id: number) => Promise<void>;
  completeLesson: (id: number, score: number) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set) => ({
  paths: [],
  currentPath: null,
  lessons: [],
  currentLesson: null,
  loading: false,

  fetchPaths: async () => {
    set({ loading: true });
    const { data } = await api.get("/lesson_paths");
    set({ paths: data.lesson_paths, loading: false });
  },

  fetchPath: async (id) => {
    set({ loading: true });
    const { data } = await api.get(`/lesson_paths/${id}`);
    set({ currentPath: data.lesson_path, lessons: data.lessons, loading: false });
  },

  fetchLesson: async (id) => {
    set({ loading: true });
    const { data } = await api.get(`/lessons/${id}`);
    set({ currentLesson: data.lesson, loading: false });
  },

  completeLesson: async (id, score) => {
    const { data } = await api.post(`/lessons/${id}/complete`, { score });
    return data;
  },
}));
