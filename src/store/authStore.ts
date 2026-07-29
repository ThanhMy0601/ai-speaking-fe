import { create } from "zustand";
import api from "../lib/api";
import type { AuthResponse, UserResponse } from "../types/api";
import type { User } from "../types/domain";

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
      const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
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
      const { data } = await api.post<AuthResponse>("/auth/register", {
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
      const { data } = await api.get<UserResponse>("/users/me");
      set({ user: data.user });
    } catch {
      set({ user: null, token: null });
      localStorage.removeItem("jwt_token");
    }
  },
}));
