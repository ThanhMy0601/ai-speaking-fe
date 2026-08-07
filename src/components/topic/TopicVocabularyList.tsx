import type { TopicVocabularyItem } from "../../types/domain";
import Skeleton from "../ui/Skeleton";

interface Props {
  items: TopicVocabularyItem[] | null;
  loading: boolean;
}

/**
 * The word list behind a topic's "Xem từ vựng" button.
 *
 * Deliberately plain: term plus Vietnamese gloss, nothing else. Pronunciation
 * audio, IPA and example sentences belong to the vocabulary notebook, which
 * enriches a shared entry per lemma. Duplicating that pipeline onto topic rows
 * would mean paying for the same word twice.
 */
export default function TopicVocabularyList({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-live="polite">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="rounded-md border border-border bg-surface-glass px-4 py-3.5 text-sm text-ink-muted">
        Chủ đề này chưa có danh sách từ vựng.
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-ink-subtle">
        {items.length} từ và cụm từ thường gặp trong chủ đề này. Gia sư sẽ dùng
        chúng một cách tự nhiên trong hội thoại.
      </p>

      <ol className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          // Grid rather than one wrapping flex row: a long gloss ("hàn huyên,
          // cập nhật tin tức sau lâu ngày không gặp") wraps to a second line,
          // and in a flex row that line starts back under the number instead
          // of under the term.
          <li
            key={`${item.term}-${i}`}
            className="grid grid-cols-[1.25rem_1fr] items-baseline gap-x-3 rounded-md border border-border bg-surface-glass px-3.5 py-2.5"
          >
            <span className="text-xs text-ink-subtle tabular-nums">{i + 1}</span>

            <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-medium text-ink">{item.term}</span>

              {/* meaning_vi is nullable — an admin can add a term without a
                  gloss, and the reshape migration left older rows null. */}
              {item.meaning_vi ? (
                <span className="text-sm text-ink-muted">{item.meaning_vi}</span>
              ) : (
                <span className="text-sm italic text-ink-subtle">chưa có nghĩa</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
