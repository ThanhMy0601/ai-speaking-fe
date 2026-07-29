import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/mswServer";
import api from "./api";

const API_BASE = "http://localhost:8000/api/v1";

describe("api request interceptor", () => {
  it("attaches the stored JWT as a Bearer token", async () => {
    localStorage.setItem("jwt_token", "stored.token");
    let receivedAuth: string | null = null;
    server.use(
      http.get(`${API_BASE}/ping`, ({ request }) => {
        receivedAuth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      })
    );

    await api.get("/ping");

    expect(receivedAuth).toBe("Bearer stored.token");
  });

  it("sends no Authorization header when there is no stored token", async () => {
    localStorage.removeItem("jwt_token");
    let receivedAuth: string | null | undefined = undefined;
    server.use(
      http.get(`${API_BASE}/ping`, ({ request }) => {
        receivedAuth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      })
    );

    await api.get("/ping");

    expect(receivedAuth).toBeNull();
  });
});

describe("api response interceptor on 401", () => {
  // Characterization test for known Phase 6 cleanup target (REBUILD_PLAN_V2.md
  // §5): today a 401 hard-navigates via `window.location.href`, which wipes
  // React state and loses the return URL. Phase 6 replaces this with
  // `authStore.logout()` + `router.navigate("/login?next=...")`. When that
  // lands, this test should be rewritten to assert the new behavior instead.
  let originalLocation: Location;

  beforeEach(() => {
    localStorage.setItem("jwt_token", "will.be.cleared");
    originalLocation = window.location;
    // jsdom throws "Not implemented: navigation" on a real href assignment;
    // stub location so we can assert the redirect instead of just
    // swallowing the error.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, href: "http://localhost:3000/roadmap" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("clears the token and redirects to /login", async () => {
    server.use(
      http.get(`${API_BASE}/protected`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );

    await expect(api.get("/protected")).rejects.toBeTruthy();

    expect(localStorage.getItem("jwt_token")).toBeNull();
    expect(window.location.href).toBe("/login");
  });
});
