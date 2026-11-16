import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

// Up/down arrows for moving an item within its list.
export function MoveButtons({ index, count, onMove, disabled }) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => onMove(index, index - 1)}
        disabled={disabled || index === 0}
        title="Move up"
        className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ArrowUp size={12} />
      </button>
      <button
        type="button"
        onClick={() => onMove(index, index + 1)}
        disabled={disabled || index === count - 1}
        title="Move down"
        className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ArrowDown size={12} />
      </button>
    </div>
  );
}

// Returns ids in their new order after moving one item from `from` to `to`.
export function moved(items, from, to) {
  const ids = items.map((item) => item.id);
  const [id] = ids.splice(from, 1);
  ids.splice(to, 0, id);
  return ids;
}

// The single place topic/lesson editing for a course lives — one topic per
// card, each with its own lessons (via LessonListEditor). Topic quizzes are
// authored separately on the Quizzes page. Shared by the admin course-manage
// page and a trainer managing materials for a class's attached course.
// `readOnly` (admins) shows the same content with no editing controls.
// `useRevision` works on (or shows) the trainer's open update to a live
// course instead of its live topics. Edits always go to whichever copy the
// server considers editable.
