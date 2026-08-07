import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminTopicStore } from "../../store/adminTopicStore";
import type { AdminTopic } from "../../types/domain";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";

export default function AdminTopicsPage() {
  const { topics, loading, saving, error, fetchTopics, reorder, deleteTopic } =
    useAdminTopicStore();
  const navigate = useNavigate();

  // Two copies of the dragged id on purpose. The ref is what `drop` reads;
  // the state is only what dims the row. Reading state in the drop handler
  // means depending on React having re-rendered between dragstart and drop —
  // true for a human dragging, false for anything faster.
  const draggingRef = useRef<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminTopic | null>(null);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const drop = async (targetId: number) => {
    const from = topics.findIndex((t) => t.id === draggingRef.current);
    const to = topics.findIndex((t) => t.id === targetId);
    draggingRef.current = null;
    setDragId(null);
    setOverId(null);
    if (from < 0 || to < 0 || from === to) return;

    const ids = topics.map((t) => t.id);
    ids.splice(to, 0, ids.splice(from, 1)[0]);

    // One request with the complete order. sequence_order is UNIQUE, so the
    // server needs the whole list to shuffle through its temporary offset
    // band; PATCHing rows one by one collides as soon as two topics swap.
    await reorder(ids).catch(() => {});
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTopic(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // 422 when the topic has practice history. Keep the dialog open so the
      // reason lands next to the button that was just pressed.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Quản lý chủ đề</h1>
          <p className="mt-1.5 text-ink-muted">
            Nội dung ở đây đi thẳng vào phiên luyện nói kế tiếp — không cần deploy lại.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/admin/topics/new")}>
          + Chủ đề mới
        </Button>
      </header>

      {error && (
        <p className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && topics.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {topics.map((topic) => (
            <li
              key={topic.id}
              draggable
              onDragStart={(e) => {
                draggingRef.current = topic.id;
                setDragId(topic.id);
                // Firefox refuses to start a drag unless some data is set.
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(topic.id));
              }}
              onDragEnd={() => {
                draggingRef.current = null;
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                // Without preventDefault the element is not a drop target at
                // all and onDrop never fires.
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overId !== topic.id) setOverId(topic.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(topic.id);
              }}
              className={[
                "flex items-center gap-3 rounded-md border bg-surface-glass px-3 py-3 transition-colors",
                dragId === topic.id
                  ? "opacity-40"
                  : overId === topic.id
                    ? "border-border-focus"
                    : "border-border",
              ].join(" ")}
            >
              <span
                className="cursor-grab select-none px-1 text-ink-subtle active:cursor-grabbing"
                aria-hidden
                title="Kéo để đổi thứ tự"
              >
                ⠿
              </span>

              <span className="w-6 shrink-0 text-sm text-ink-subtle tabular-nums">
                {topic.sequence_order}
              </span>

              <span
                className="grid size-10 shrink-0 place-items-center rounded-md text-lg"
                style={{
                  background: `linear-gradient(135deg, ${topic.gradient_from}, ${topic.gradient_to})`,
                }}
                aria-hidden
              >
                {topic.icon}
              </span>

              <span className="min-w-0 flex-1">
                <Link
                  to={`/admin/topics/${topic.id}`}
                  className="block truncate font-medium text-ink hover:underline"
                >
                  {topic.title}
                </Link>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-subtle">
                  <span>{topic.target_vocabulary.length} từ</span>
                  <span aria-hidden>·</span>
                  <span>{topic.level_count} level</span>
                  {topic.cefr_level && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{topic.cefr_level.toUpperCase()}</span>
                    </>
                  )}
                </span>
              </span>

              {!topic.active && <Badge tone="neutral">Ẩn</Badge>}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingDelete(topic)}
                aria-label={`Xoá ${topic.title}`}
              >
                Xoá
              </Button>
            </li>
          ))}
        </ol>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Xoá chủ đề?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Huỷ
            </Button>
            <Button variant="danger" loading={saving} onClick={confirmDelete}>
              Xoá vĩnh viễn
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-ink-muted">
            Xoá <strong className="text-ink">{pendingDelete?.title}</strong> cùng toàn bộ
            level và từ vựng của nó. Không hoàn tác được.
          </p>
          <p className="text-sm text-ink-subtle">
            Nếu đã có người luyện chủ đề này, hệ thống sẽ từ chối xoá để không làm mất
            lịch sử hội thoại của họ — khi đó hãy bỏ đánh dấu "Đang hiển thị" trong trang
            chỉnh sửa để ẩn chủ đề.
          </p>
          {error && (
            <p className="rounded-md border border-[rgb(248_113_113/0.3)] bg-danger-dim px-3.5 py-3 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
