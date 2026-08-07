import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import Button from "./ui/Button";
import Spinner from "./ui/Spinner";

/**
 * Gates the admin section on `role`.
 *
 * Unlike ProtectedRoute, this cannot decide from the token alone: `role`
 * arrives with the /users/me response, and `user` is null until App's
 * fetchMe() resolves. Redirecting on a null user would bounce an admin out of
 * their own panel on every page refresh, and the bug only shows up on a hard
 * reload — never while clicking around. So wait for the fetch to settle.
 *
 * This is presentation only. Authorisation is enforced server-side in
 * Api::V1::Admin::BaseController#require_admin, which raises Forbidden; a
 * learner who types the URL still gets 403 from every endpoint.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, token } = useAuthStore();

  // Nested under ProtectedRoute, so a missing token is already handled — but
  // if fetchMe cleared it mid-render, don't flash the denial screen.
  if (token && !user) {
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <span className="text-4xl" aria-hidden>
          🔒
        </span>
        <h1 className="text-xl font-semibold">Khu vực quản trị</h1>
        <p className="text-ink-muted">
          Tài khoản của bạn không có quyền truy cập trang này.
        </p>
        <Link to="/roadmap">
          <Button variant="primary">Về trang chủ</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
