import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, Settings2, Clock, Ban, CheckCircle2, PencilLine, Trash2 } from "lucide-react";
import Header from "../components/Header";
import CourseFormModal from "../components/CourseFormModal";
import { selectCoursesByCreator, removeCourse } from "../store/slices/coursesSlice";
import { pushToast } from "../store/slices/uiSlice";
import { useConfirm } from "../components/ConfirmDialog";
import { selectCurrentUser } from "../store/slices/authSlice";

const STATUS_META = {
  draft: { pill: "bg-blue-50 text-blue-700 border-blue-200", icon: PencilLine, label: "Draft" },
  approved: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Approved" },
  pending: { pill: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pending approval" },
  denied: { pill: "bg-stone-100 text-stone-500 border-stone-200", icon: Ban, label: "Denied" },
};

// Published courses may already have enrolled learners, so only courses
// that haven't gone live yet can be deleted.
export const canDeleteCourse = (course) => ["draft", "pending", "denied"].includes(course.status);

export async function confirmDeleteCourse({ confirm, dispatch, course }) {
  const ok = await confirm({
    title: `Delete "${course.title}"?`,
    message: "Its topics, lessons, quizzes and assignments will be removed too. This can't be undone.",
    confirmLabel: "Delete course",
    tone: "danger",
  });
  if (!ok) return false;
  dispatch(removeCourse({ courseId: course.id }));
  dispatch(pushToast({ type: "success", message: `"${course.title}" was deleted.` }));
  return true;
}

export default function TrainerCourses({ onMenuClick }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const currentUser = useSelector(selectCurrentUser);
  const courses = useSelector((state) => selectCoursesByCreator(state, currentUser.id));
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Courses" subtitle="Build a course as a draft, then submit it for admin approval once its topics and lessons are in place." onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={14} /> Add course
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
            You haven't created any courses yet — add one above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">
                    <Layers size={12} className="inline" /> Topics
                  </th>
                  <th className="px-4 py-3">Quizzes</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {courses.map((c) => {
                  const quizCount = c.topics.filter((t) => t.quiz?.questions?.length).length;
                  const meta = STATUS_META[c.status || "approved"];
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={c.id}>
                      <td className="flex items-center gap-2.5 px-4 py-3 font-semibold text-stone-800">
                        <img src={c.thumbnailImage} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                        <span>{c.title}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{c.category}</td>
                      <td className="px-4 py-3">
                        <span className={`flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.pill}`}>
                          <StatusIcon size={10} /> {meta.label}
                        </span>
                        {c.revision && (
                          <span
                            className={`mt-1 flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              c.revision.status === "pending"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : c.revision.status === "denied"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                            }`}
                          >
                            {c.revision.status === "pending" ? "Update pending" : c.revision.status === "denied" ? "Update denied" : "Unpublished changes"}
                          </span>
                        )}
                        {c.revision?.status === "denied" && c.revision.review?.reason && (
                          <p className="mt-1 max-w-xs text-[10px] leading-snug text-rose-700" title={c.revision.review.reason}>
                            <span className="font-semibold">Feedback:</span> <span className="line-clamp-2">{c.revision.review.reason}</span>
                          </p>
                        )}
                        {c.status === "denied" && c.review?.reason && (
                          <p className="mt-1 max-w-xs text-[10px] leading-snug text-rose-700" title={c.review.reason}>
                            <span className="font-semibold">Feedback:</span> <span className="line-clamp-2">{c.review.reason}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{c.topics.length}</td>
                      <td className="px-4 py-3 text-stone-500">{quizCount || "—"}</td>
                      <td className="px-4 py-3 text-stone-500">{c.studentsCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/trainer/courses/${c.id}/manage`)}
                            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                          >
                            <Settings2 size={11} /> {c.status === "draft" ? "Continue editing" : "Manage"}
                          </button>
                          {canDeleteCourse(c) && (
                            <button
                              onClick={() => confirmDeleteCourse({ confirm, dispatch, course: c })}
                              title="Delete course"
                              className="rounded-lg border border-stone-200 px-2 py-1.5 text-stone-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CourseFormModal onClose={() => setShowForm(false)} onCreated={(courseId) => navigate(`/trainer/courses/${courseId}/manage`)} />
      )}
    </div>
  );
}
