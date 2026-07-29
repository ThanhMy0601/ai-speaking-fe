import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Split layout for the signed-out screens: pitch on the left, form on the
 * right, form-only on mobile.
 */
export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Marketing half — hidden below lg rather than stacked, so a phone
          shows the form immediately instead of a screen of copy. */}
      <aside className="relative hidden overflow-hidden border-r border-border p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40rem 30rem at 20% 20%, rgb(109 94 248 / 0.28), transparent 60%)," +
              "radial-gradient(32rem 26rem at 80% 80%, rgb(34 211 238 / 0.2), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-sm bg-linear-135 from-accent to-accent-to">
            🗣️
          </span>
          SpeakAI
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold text-balance">
            Speak English out loud, every day, without booking a tutor.
          </h2>
          <p className="mt-4 text-ink-muted">
            Real conversations with an AI partner that listens, replies, and
            afterwards tells you exactly which sentences to fix.
          </p>
        </div>

        <ul className="relative flex flex-col gap-3 text-sm text-ink-muted">
          {[
            "Ten topics, from small talk to interviews",
            "Grammar notes drawn from what you actually said",
            "Every session recorded so you can listen back",
          ].map((line) => (
            <li key={line} className="flex items-center gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[rgb(74_222_128/0.16)] text-2xs text-success">
                ✓
              </span>
              {line}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="inline-grid size-10 place-items-center rounded-sm bg-linear-135 from-accent to-accent-to">
              🗣️
            </span>
          </div>

          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-sm text-ink-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
