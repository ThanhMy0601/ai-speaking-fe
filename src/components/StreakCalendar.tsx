import { cx } from "../lib/cx";

interface Props {
  /** ISO dates (YYYY-MM-DD) on which the learner practised. */
  activeDates: string[];
  /** How many days back to render. */
  days?: number;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A contribution-graph style calendar of practice days.
 *
 * Replaces a row of "●" characters whose CSS classes (.streak-calendar,
 * .streak-day) had no rules anywhere, so it rendered as undifferentiated
 * bullets with no sense of time.
 */
export default function StreakCalendar({ activeDates, days = 91 }: Props) {
  const active = new Set(activeDates.map((d) => d.slice(0, 10)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pad to the start of the week so columns line up as calendar weeks.
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setDate(start.getDate() - start.getDay());

  const cells: { date: Date; iso: string; future: boolean }[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    cells.push({ date, iso: isoDate(date), future: false });
  }
  // Fill out the final week so the grid isn't ragged.
  while (cells.length % 7 !== 0) {
    const date = new Date(cells[cells.length - 1].date);
    date.setDate(date.getDate() + 1);
    cells.push({ date, iso: isoDate(date), future: true });
  }

  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <div className="grid shrink-0 grid-rows-7 gap-1 pt-0.5 text-2xs text-ink-subtle">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="grid h-3 place-items-center leading-none">
            {i % 2 === 1 ? label : ""}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-1">
            {week.map((cell) => {
              const on = active.has(cell.iso);
              const label = cell.date.toLocaleDateString([], {
                weekday: "short",
                day: "numeric",
                month: "short",
              });

              return (
                <span
                  key={cell.iso}
                  title={cell.future ? undefined : `${label} — ${on ? "practised" : "no practice"}`}
                  className={cx(
                    "size-3 rounded-[3px]",
                    cell.future
                      ? "bg-transparent"
                      : on
                        ? "bg-success shadow-[0_0_8px_rgb(74_222_128/0.5)]"
                        : "bg-white/7"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
