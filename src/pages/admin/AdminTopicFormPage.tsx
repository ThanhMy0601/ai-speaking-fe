import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminTopicStore, type TopicDraft } from "../../store/adminTopicStore";
import type { CefrLevel } from "../../types/domain";
import VocabularyEditor from "../../components/admin/VocabularyEditor";
import StringListEditor from "../../components/admin/StringListEditor";
import TopicLevelsEditor from "../../components/admin/TopicLevelsEditor";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";

const CEFR: CefrLevel[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

const EMPTY: TopicDraft = {
  title: "",
  description: "",
  icon: "💬",
  color: "#6366f1",
  gradient_from: "#818cf8",
  gradient_to: "#6366f1",
  cefr_level: "a2",
  estimated_minutes: 10,
  active: true,
  conversation_guide: "",
  opening_line: "",
  target_vocabulary: [],
  target_grammar: [],
};

export default function AdminTopicFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const topicId = isNew ? null : Number(id);
  const navigate = useNavigate();

  const { current, loading, saving, error, fetchTopic, clearCurrent, createTopic, updateTopic } =
    useAdminTopicStore();

  const [draft, setDraft] = useState<TopicDraft>(EMPTY);

  useEffect(() => {
    if (topicId) fetchTopic(topicId);
    else clearCurrent();
  }, [topicId, fetchTopic, clearCurrent]);

  useEffect(() => {
    if (!current || current.id !== topicId) return;
    setDraft({
      title: current.title,
      description: current.description,
      icon: current.icon,
      color: current.color,
      gradient_from: current.gradient_from,
      gradient_to: current.gradient_to,
      cefr_level: current.cefr_level,
      estimated_minutes: current.estimated_minutes,
      active: current.active,
      conversation_guide: current.conversation_guide ?? "",
      opening_line: current.opening_line ?? "",
      target_vocabulary: current.target_vocabulary,
      target_grammar: current.target_grammar,
    });
  }, [current, topicId]);

  const set = <K extends keyof TopicDraft>(key: K, value: TopicDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (topicId) {
        await updateTopic(topicId, draft);
      } else {
        const created = await createTopic(draft);
        navigate(`/admin/topics/${created.id}`, { replace: true });
      }
    } catch {
      // The store holds the message; it renders below the form.
    }
  };

  if (topicId && loading && !current) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-56" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const field =
    "w-full rounded-sm border border-border bg-surface-base px-3 py-2 text-sm text-ink " +
    "placeholder:text-ink-subtle focus-visible:border-border-focus";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-md text-2xl"
            style={{
              background: `linear-gradient(135deg, ${draft.gradient_from}, ${draft.gradient_to})`,
            }}
            aria-hidden
          >
            {draft.icon}
          </span>
          <h1 className="truncate text-xl font-semibold sm:text-2xl">
            {isNew ? "Chủ đề mới" : draft.title || "Chỉnh sửa chủ đề"}
          </h1>
        </div>
        <Link to="/admin/topics">
          <Button variant="ghost">← Danh sách</Button>
        </Link>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-glass p-5">
          <Input
            label="Tiêu đề"
            value={draft.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            required
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Mô tả</span>
            <textarea
              className={field}
              rows={2}
              value={draft.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Icon"
              value={draft.icon ?? ""}
              onChange={(e) => set("icon", e.target.value)}
              maxLength={4}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Trình độ CEFR</span>
              <select
                className={field}
                value={draft.cefr_level ?? ""}
                onChange={(e) =>
                  set("cefr_level", (e.target.value || null) as CefrLevel | null)
                }
              >
                <option value="">—</option>
                {CEFR.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Thời lượng (phút)"
              type="number"
              min={1}
              value={draft.estimated_minutes ?? 10}
              onChange={(e) => set("estimated_minutes", Number(e.target.value))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ColourField
              label="Màu chính"
              value={draft.color ?? "#6366f1"}
              onChange={(v) => set("color", v)}
            />
            <ColourField
              label="Gradient từ"
              value={draft.gradient_from ?? "#818cf8"}
              onChange={(v) => set("gradient_from", v)}
            />
            <ColourField
              label="Gradient đến"
              value={draft.gradient_to ?? "#6366f1"}
              onChange={(v) => set("gradient_to", v)}
            />
          </div>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={draft.active ?? true}
              onChange={(e) => set("active", e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            <span className="text-sm text-ink">Đang hiển thị với người học</span>
          </label>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-glass p-5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Nội dung cho gia sư</h2>
            <p className="mt-1 text-xs text-ink-subtle">
              Câu mở đầu được đọc nguyên văn ở đầu buổi học. Hướng dẫn hội thoại đi vào
              system prompt của gia sư.
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Câu mở đầu</span>
            <textarea
              className={field}
              rows={2}
              value={draft.opening_line ?? ""}
              onChange={(e) => set("opening_line", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Hướng dẫn hội thoại</span>
            <textarea
              className={field}
              rows={6}
              value={draft.conversation_guide ?? ""}
              onChange={(e) => set("conversation_guide", e.target.value)}
            />
          </label>
        </section>

        <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface-glass p-5">
          <VocabularyEditor
            items={draft.target_vocabulary ?? []}
            onChange={(items) => set("target_vocabulary", items)}
          />
          <StringListEditor
            label="Ngữ pháp trọng tâm"
            placeholder="vd. Present perfect"
            hint="Chỉ dẫn cho gia sư — người học không nhìn thấy, nên không cần dịch."
            items={draft.target_grammar ?? []}
            onChange={(items) => set("target_grammar", items)}
          />
        </section>

        {error && (
          <p className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" loading={saving}>
            {isNew ? "Tạo chủ đề" : "Lưu thay đổi"}
          </Button>
          <Link to="/admin/topics">
            <Button type="button" variant="ghost">
              Huỷ
            </Button>
          </Link>
        </div>
      </form>

      {/* Levels need a persisted topic to hang off, so they only appear once
          the topic exists. */}
      {topicId && current?.id === topicId && (
        <TopicLevelsEditor topicId={topicId} levels={current.levels} />
      )}
    </div>
  );
}

function ColourField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-sm border border-border bg-transparent"
        />
        <input
          aria-label={`${label} (mã hex)`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-sm border border-border bg-surface-base px-2.5 py-1.5 font-mono text-sm text-ink"
        />
      </span>
    </label>
  );
}
