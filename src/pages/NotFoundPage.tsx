import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

/**
 * There was no catch-all route at all, so a bad URL rendered a blank page
 * under the nav bar with no indication anything had gone wrong.
 */
export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="text-5xl" aria-hidden>
          🧭
        </span>
        <h1 className="text-2xl font-semibold">This page doesn't exist</h1>
        <p className="text-ink-muted">
          The link may be out of date, or the page may have moved.
        </p>
        <Link to="/roadmap">
          <Button variant="primary">Back to your journey</Button>
        </Link>
      </div>
    </div>
  );
}
