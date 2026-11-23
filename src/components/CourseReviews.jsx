import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { StarRating, StarInput } from "./Stars";
import { useApiAction } from "../hooks/useApiAction";
import { useConfirm } from "./ConfirmDialog";
import { fetchCourseRatings, fetchMyRating, saveMyRating, deleteMyRating, selectCourseRatings, selectMyRating } from "../store/slices/ratingsSlice";
import { timeAgo } from "../utils/time";

const MAX_REVIEW = 2000;

// The learner's own rating for a completed course: a form to leave one, or
// their rating with Edit / Delete. Only for completed courses — the server
// refuses ratings before that.
export function MyCourseRating({ courseId, compact = false }) {
  const dispatch = useDispatch();
  const mine = useSelector((state) => selectMyRating(state, courseId));
  const [run, busy] = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    dispatch(fetchMyRating({ courseId }));
  }, [dispatch, courseId]);

  const startEditing = () => {
    setRating(mine?.rating || 0);
    setReview(mine?.review || "");
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!rating) return;
    const saved = await run(saveMyRating({ courseId, rating, review }), { successMessage: mine ? "Your review was updated." : "Thanks for rating this course!" });
    if (saved) setEditing(false);
  };

  const remove = async () => {
    const ok = await confirm({ title: "Delete your review?", message: "Your rating and review will be removed from this course.", confirmLabel: "Delete", tone: "danger" });
    if (ok) run(deleteMyRating({ courseId }), { successMessage: "Your review was deleted." });
  };

  if (mine === undefined) {
    return (
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Loader2 size={13} className="animate-spin" /> Loading your review...
      </div>
    );
  }

  if (mine && !editing) {
    return (
      <div className={compact ? "" : "rounded-xl border border-brand-100 bg-brand-50/50 p-4"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-stone-700">Your review</p>
          <div className="flex gap-1">
            <button onClick={startEditing} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100">
              <Pencil size={11} /> Edit
            </button>
            <button onClick={remove} disabled={busy} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
        <StarRating value={mine.rating} size={16} className="mt-1.5" />
        {mine.review && <p className="mt-1.5 whitespace-pre-line text-sm text-stone-600">{mine.review}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={save} className={compact ? "space-y-3" : "space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4"}>
      <div>
        <p className="text-xs font-bold text-stone-700">{mine ? "Edit your review" : "How was this course?"}</p>
        <p className="text-[11px] text-stone-500">Your rating helps other learners choose courses.</p>
      </div>
      <StarInput value={rating} onChange={setRating} />
      <div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value.slice(0, MAX_REVIEW))}
          rows={3}
          placeholder="What did you like? What could be better? (optional)"
          className="w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
        <p className="mt-0.5 text-right text-[10px] text-stone-400">
          {review.length}/{MAX_REVIEW}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!rating || busy}
          className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving..." : mine ? "Save changes" : "Submit review"}
        </button>
        {mine && (
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// A course's reviews: the average, the learner's own review (once they've
// completed it), and everyone's reviews, newest first.
export default function CourseReviews({ course, enrollment, currentUser }) {
  const dispatch = useDispatch();
  const list = useSelector((state) => selectCourseRatings(state, course.id));

  useEffect(() => {
    dispatch(fetchCourseRatings({ courseId: course.id }));
  }, [dispatch, course.id]);

  const isLearner = currentUser?.role === "learner";
  const completed = enrollment?.status === "completed";
  const count = course.ratingsCount || 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-stone-800">Reviews</h2>
          {count > 0 ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-stone-900">{Number(course.averageRating).toFixed(1)}</span>
              <div>
                <StarRating value={Number(course.averageRating)} size={15} />
                <p className="text-[11px] text-stone-400">
                  {count} {count === 1 ? "rating" : "ratings"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-xs text-stone-400">No reviews yet.</p>
          )}
        </div>
      </div>

      {isLearner && enrollment && (
        <div className="mt-4">
          {completed ? (
            <MyCourseRating courseId={course.id} />
          ) : (
            <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">Finish the course to leave a review.</p>
          )}
        </div>
      )}

      <ul className="mt-4 divide-y divide-stone-100">
        {list.items
          .filter((r) => !(isLearner && r.user.id === currentUser.id && completed))
          .map((r) => (
            <li key={r.id} className="flex gap-3 py-3.5">
              <img src={r.user.avatarUrl} alt={r.user.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-xs font-semibold text-stone-800">{r.user.name}</span>
                  <StarRating value={r.rating} size={12} />
                  <span className="text-[10px] text-stone-400">{timeAgo(r.createdAt)}</span>
                </div>
                {r.review && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-600">{r.review}</p>}
              </div>
            </li>
          ))}
        {list.status === "loading" && list.items.length === 0 && (
          <li className="flex items-center gap-2 py-3 text-xs text-stone-400">
            <Loader2 size={13} className="animate-spin" /> Loading reviews...
          </li>
        )}
        {list.status === "succeeded" && list.items.length === 0 && (
          <li className="flex items-center gap-2 py-3 text-xs text-stone-400">
            <MessageSquareText size={14} /> Be the first to review this course once you've completed it.
          </li>
        )}
      </ul>

      {list.page < list.lastPage && (
        <button
          onClick={() => dispatch(fetchCourseRatings({ courseId: course.id, more: true }))}
          disabled={list.status === "loading"}
          className="mt-2 w-full rounded-lg border border-stone-200 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
        >
          {list.status === "loading" ? "Loading..." : "Show more reviews"}
        </button>
      )}
    </div>
  );
}
