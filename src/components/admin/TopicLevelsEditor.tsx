import { useState } from "react";
import { useAdminTopicStore, type LevelDraft } from "../../store/adminTopicStore";
import type { AdminTopicLevel } from "../../types/api";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

interface Props {
  topicId: number;
  levels: AdminTopicLevel[];
}

/**
 * Levels for one topic.
 *
 * Level N is what a learner gets on their Nth attempt, which is what makes
 * "practise again" mean something. A level leaving a field blank falls back
 * to the topic's own content (TopicLevel#effective_*), so an admin can deepen
 * one aspect without re-authoring everything — the placeholders say so.
 */
export default function TopicLevelsEditor({ topicId, levels }: Props) {
  const { createLevel, updateLevel, deleteLevel } = useAdminTopicStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError("Không lưu được thay đổi cho level.");
    } finally {
      setBusy(false);
    }
  };

  const nextLevel = levels.reduce((max, l) => Math.max(max, l.level), 0) + 1;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-glass p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Levels</h2>
          <p className="mt-1 text-xs text-ink-subtle">
            Level N dùng cho lần luyện thứ N. Bỏ trống ô nào thì level đó dùng nội dung
            của chủ đề.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => run(() => createLevel(topicId, { level: nextLevel, title: `Level ${nextLevel}` }))}
        >
          + Thêm level
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {levels.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Chưa có level nào — mọi lần luyện sẽ dùng nội dung chung của chủ đề.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {levels.map((level) => (
            <LevelRow
              key={level.id}
              level={level}
              busy={busy}
              onSave={(draft) => run(() => updateLevel(level.id, draft))}
              onDelete={() => run(() => deleteLevel(level.id))}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function LevelRow({
  level,
  busy,
  onSave,
  onDelete,
}: {
  level: AdminTopicLevel;
  busy: boolean;
  onSave: (draft: LevelDraft) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LevelDraft>({
    title: level.title,
    opening_line: level.opening_line ?? "",
    conversation_guide: level.conversation_guide ?? "",
    active: level.active,
  });

  const field =
    "w-full rounded-sm border border-border bg-surface-base px-2.5 py-1.5 text-sm text-ink " +
    "placeholder:text-ink-subtle focus-visible:border-border-focus";

  return (
    <li className="rounded-md border border-border bg-surface-base/40">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <Badge tone="accent">L{level.level}</Badge>
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{level.title}</span>
        {!level.active && <Badge tone="neutral">Ẩn</Badge>}
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Thu gọn" : "Sửa"}
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-3.5 py-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-muted">Tiêu đề</span>
            <input
              className={field}
              value={draft.title ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-muted">Câu mở đầu</span>
            <textarea
              className={field}
              rows={2}
              placeholder="Bỏ trống để dùng câu mở đầu của chủ đề"
              value={draft.opening_line ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, opening_line: e.target.value }))}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-muted">Hướng dẫn hội thoại</span>
            <textarea
              className={field}
              rows={4}
              placeholder="Bỏ trống để dùng hướng dẫn của chủ đề"
              value={draft.conversation_guide ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, conversation_guide: e.target.value }))
              }
            />
          </label>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={draft.active ?? true}
              onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              className="size-4 accent-[var(--color-accent)]"
            />
            <span className="text-sm text-ink">Đang dùng</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => onSave(draft)}
            >
              Lưu level
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={onDelete}
            >
              Xoá level
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
