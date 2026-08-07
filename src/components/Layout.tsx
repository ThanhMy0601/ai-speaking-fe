import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { cx } from "../lib/cx";

const NAV = [
  { to: "/roadmap", label: "Journey" },
  { to: "/sessions", label: "History" },
  { to: "/profile", label: "Profile" },
];

function navClass({ isActive }: { isActive: boolean }) {
  return cx(
    "relative rounded-sm px-3 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
    isActive ? "text-ink" : "text-ink-muted hover:text-ink",
    // The underline the old stylesheet defined but could never show: it
    // styled `a.active`, while the nav rendered plain <Link>s, so no link
    // ever carried the class.
    isActive &&
      "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full " +
        "after:bg-linear-to-r after:from-accent after:to-accent-to"
  );
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className="sticky top-0 border-b border-border bg-[rgb(11_16_32/0.82)] backdrop-blur-xl"
        style={{ zIndex: "var(--z-sticky)" }}
      >
        <nav
          className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6"
          aria-label="Main"
        >
          <NavLink to="/roadmap" className="flex shrink-0 items-center gap-2 font-semibold text-ink">
            <span
              className="grid size-8 place-items-center rounded-sm bg-linear-135 from-accent to-accent-to text-sm"
              aria-hidden
            >
              🗣️
            </span>
            <span className="hidden sm:inline">SpeakAI</span>
          </NavLink>

          {/* Scrolls rather than wrapping on narrow screens — the old nav
              packed a logo, three links, two stat pills and a logout button
              into one un-wrapped flex row and overflowed below ~600px. */}
          <div className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
            {/* Hiding this is presentation, not security — the endpoints
                behind it return 403 to anyone who is not an admin. */}
            {user?.role === "admin" && (
              <NavLink to="/admin/topics" className={navClass}>
                Admin
              </NavLink>
            )}
          </div>

          {user && (
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-glass px-2.5 py-1 text-xs font-medium text-ink-muted tabular-nums sm:inline-flex"
                title="Experience points"
              >
                <span aria-hidden>⚡</span>
                {user.total_xp}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-glass px-2.5 py-1 text-xs font-medium text-ink-muted tabular-nums"
                title="Day streak"
              >
                <span aria-hidden>🔥</span>
                {user.current_streak}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-sm px-2 py-1.5 text-sm text-ink-subtle transition-colors hover:text-ink"
              >
                Log out
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
