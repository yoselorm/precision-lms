import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2, MessageSquareText, Trash2 } from "lucide-react";
import Header from "../components/Header";
import { StarRating } from "../components/Stars";
import { useConfirm } from "../components/ConfirmDialog";
import { useApiAction } from "../hooks/useApiAction";
import { usePageData } from "../hooks/usePageData";
import { loadAdminRatings } from "../store/loadAppData";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { fetchAdminRatings, deleteRating, selectAdminRatings } from "../store/slices/ratingsSlice";
import { shortDate } from "../utils/time";

// Admin moderation of course ratings and reviews: every review across all
// courses (or one course), newest first, with permanent delete.
export default function AdminReviews({ onMenuClick }) {
  usePageData(loadAdminRatings);
  const dispatch = useDispatch();
  const courses = useSelector(selectAllCourses);
  const list = useSelector(selectAdminRatings);
  const [courseId, setCourseId] = useState("");
  const [run, busy] = useApiAction();
  const confirm = useConfirm();

  useEffect(() => {
    dispatch(fetchAdminRatings({ courseId }));
  }, [dispatch, courseId]);

  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  // The admin course list doesn't carry rating counts, so every course is
  // offered (most only appear in the public/user lists with their numbers).
  const sorted = useMemo(() => [...courses].sort((a, b) => a.title.localeCompare(b.title)), [courses]);
  const selected = courseById.get(courseId);

  const remove = async (r) => {
    const course = courseById.get(r.courseId);
    const ok = await confirm({
      title: "Delete this review?",
      message: `${r.user.name}'s ${r.rating}-star review${course ? ` of "${course.title}"` : ""} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete review",
      tone: "danger",
    });
    if (ok) run(deleteRating({ id: r.id, courseId: r.courseId }), { successMessage: "Review deleted." });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Reviews" subtitle="Course ratings and reviews from learners. Remove any that break the rules." onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="min-w-0 max-w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 sm:w-80"
          >
            <option value="">All courses</option>
            {sorted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.ratingsCount > 0 ? ` (${c.ratingsCount})` : ""}
              </option>
            ))}
          </select>
          {selected && courseId && list.status === "succeeded" && (
            <span className="text-xs text-stone-500">
              {list.items.length === 0 ? "No reviews for this course." : `${list.items.length}${list.page < list.lastPage ? "+" : ""} review${list.items.length === 1 ? "" : "s"}`}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {list.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-stone-400">
              {list.status === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Loading reviews...
                </>
              ) : list.status === "failed" ? (
                "Couldn't load reviews. Refresh the page to try again."
              ) : (
                <>
                  <MessageSquareText size={20} className="text-stone-300" /> No reviews yet.
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {list.items.map((r) => {
                const course = courseById.get(r.courseId);
                return (
                  <li key={r.id} className="flex gap-3 p-4">
                    <img src={r.user.avatarUrl} alt={r.user.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-stone-800">{r.user.name}</span>
                        <StarRating value={r.rating} size={13} />
                        <span className="text-[11px] text-stone-400">{shortDate(r.createdAt)}</span>
                      </div>
                      {!courseId && (
                        <p className="mt-0.5 truncate text-xs text-stone-500">
                          on{" "}
                          {course ? (
                            <Link to={`/admin/courses/${course.id}/manage`} className="font-medium text-brand-700 hover:underline">
                              {course.title}
                            </Link>
                          ) : (
                            "a deleted course"
                          )}
                        </p>
                      )}
                      {r.review ? (
                        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-stone-600">{r.review}</p>
                      ) : (
                        <p className="mt-1.5 text-xs italic text-stone-400">No written review — rating only.</p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(r)}
                      disabled={busy}
                      title="Delete review"
                      className="h-fit shrink-0 rounded-lg border border-stone-200 p-2 text-stone-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {list.page < list.lastPage && (
          <button
            onClick={() => dispatch(fetchAdminRatings({ courseId, more: true }))}
            disabled={list.status === "loading"}
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
          >
            {list.status === "loading" ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
