import { create } from "zustand";
import api from "../lib/api";

interface User {
  id: number;
  email: string;
  display_name: string;
  learning_goal: string | null;
  proficiency_level: string | null;
  onboarding_completed: boolean;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  total_practice_hours: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("jwt_token"),
  loading: false,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("jwt_token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch {
      set({ loading: false });
      throw new Error("Invalid email or password");
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/register", {
        email,
        password,
        display_name: displayName,
      });
      localStorage.setItem("jwt_token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch {
      set({ loading: false });
      throw new Error("Registration failed");
    }
  },

  logout: () => {
    localStorage.removeItem("jwt_token");
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get("/users/me");
      set({ user: data.user });
    } catch {
      set({ user: null, token: null });
      localStorage.removeItem("jwt_token");
    }
  },
}));
