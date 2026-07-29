import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/mswServer";
import { useAuthStore } from "./authStore";

const API_BASE = "http://localhost:8000/api/v1";

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null, token: null, loading: false });
});

describe("authStore.login", () => {
  it("stores the token and user on success", async () => {
    server.use(
      http.post(`${API_BASE}/auth/login`, () =>
        HttpResponse.json({
          token: "fake.jwt.token",
          user: { id: 1, email: "a@example.com", display_name: "A" },
        })
      )
    );

    await useAuthStore.getState().login("a@example.com", "password123");

    expect(useAuthStore.getState().token).toBe("fake.jwt.token");
    expect(useAuthStore.getState().user?.email).toBe("a@example.com");
    expect(localStorage.getItem("jwt_token")).toBe("fake.jwt.token");
  });

  it("throws and resets loading on invalid credentials", async () => {
    server.use(
      http.post(`${API_BASE}/auth/login`, () =>
        HttpResponse.json({ error: "Invalid email or password" }, { status: 401 })
      )
    );

    await expect(
      useAuthStore.getState().login("a@example.com", "wrong")
    ).rejects.toThrow();

    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });
});

describe("authStore.logout", () => {
  it("clears the token from state and localStorage", () => {
    localStorage.setItem("jwt_token", "some.token");
    useAuthStore.setState({ token: "some.token", user: null });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("jwt_token")).toBeNull();
  });
});

describe("authStore.fetchMe", () => {
  it("populates the user on success", async () => {
    server.use(
      http.get(`${API_BASE}/users/me`, () =>
        HttpResponse.json({ user: { id: 2, email: "b@example.com", display_name: "B" } })
      )
    );

    await useAuthStore.getState().fetchMe();

    expect(useAuthStore.getState().user?.id).toBe(2);
  });

  it("clears user and token when the token is rejected", async () => {
    localStorage.setItem("jwt_token", "stale.token");
    useAuthStore.setState({ token: "stale.token" });
    server.use(
      http.get(`${API_BASE}/users/me`, () => HttpResponse.json({ error: "Unauthorized" }, { status: 401 }))
    );

    await useAuthStore.getState().fetchMe();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("jwt_token")).toBeNull();
  });
});
