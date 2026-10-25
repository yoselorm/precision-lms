import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, Eye, Check, Ban, Clock, X } from "lucide-react";
import Header from "../components/Header";
import CourseFormModal from "../components/CourseFormModal";
import { selectAllCourses, setCourseStatus, reviewCourseUpdate } from "../store/slices/coursesSlice";
import { pushToast } from "../store/slices/uiSlice";
import ModalOverlay from "../components/ModalOverlay";

const STATUS_PILL = {
  draft: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  denied: "bg-stone-100 text-stone-500 border-stone-200",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending approval" },
];

function DenyCourseModal({ course, isUpdate = false, onDeny, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <ModalOverlay>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (reason.trim()) onDeny(reason);
        }}
        className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">{isUpdate ? "Deny course update" : "Deny course"}</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-stone-500">
          "{course.title}" — the trainer will see your feedback and can make changes and resubmit.
          {isUpdate && " The live version stays as it is."}
        </p>
        <label className="mb-1 block text-xs font-semibold text-stone-600">Reason for the trainer</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          required
          autoFocus
          placeholder="e.g. Topic 2 needs at least one video lesson, and the quiz pass mark should be 70%."
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!reason.trim()}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdate ? "Deny update" : "Deny course"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

export default function AdminCourses({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const courses = useSelector(selectAllCourses);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [denying, setDenying] = useState(null);

  const awaitingReview = (c) => c.status === "pending" || c.revision?.status === "pending";
  const pendingCount = courses.filter(awaitingReview).length;
  const filtered = useMemo(() => (filter === "pending" ? courses.filter(awaitingReview) : courses), [courses, filter]);

  const handleUpdateReview = (course, approve, reason) => {
    dispatch(reviewCourseUpdate({ courseId: course.id, approve, reason }));
    dispatch(
      pushToast({
        type: approve ? "success" : "info",
        message: approve ? `The update to "${course.title}" is now live.` : `The update to "${course.title}" was denied.`,
      })
    );
  };

  const handleStatusChange = (course, status, reason) => {
    dispatch(setCourseStatus({ courseId: course.id, status, reason }));
    dispatch(
      pushToast({
        type: status === "approved" ? "success" : "info",
        message: `"${course.title}" was ${status === "approved" ? "approved and is now public" : "denied"}.`,
      })
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Courses" subtitle={`${courses.length} courses published`} onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`relative rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {f.label}
                {f.id === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={14} /> Add course
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Certificate</th>
                <th className="px-4 py-3">
                  <Layers size={12} className="inline" /> Topics
                </th>
                <th className="px-4 py-3">Quizzes</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((c) => {
                const quizCount = c.topics.filter((t) => t.quiz?.questions?.length).length;
                const status = c.status || "approved";
                return (
                  <tr key={c.id}>
                    <td className="flex items-center gap-2.5 px-4 py-3 font-semibold text-stone-800">
                      <img src={c.thumbnailImage} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                      <span>
                        {c.title}
                        {c.mandatory && (
                          <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
                            Mandatory
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{c.category}</td>
                    <td className="px-4 py-3">
                      <span className={`flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_PILL[status]}`}>
                        {status === "pending" && <Clock size={10} />}
                        {status}
                      </span>
                      {c.revision?.status === "pending" && (
                        <span className="mt-1 flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Clock size={10} /> Update pending
                        </span>
                      )}
                      {status === "denied" && c.review?.reason && (
                        <p className="mt-1 max-w-[14rem] text-[10px] leading-snug text-stone-500" title={c.review.reason}>
                          <span className="line-clamp-2">{c.review.reason}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.price > 0 ? (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">GH₵{c.price}</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500">{c.certificate ? "Yes" : "—"}</td>
                    <td className="px-4 py-3 text-stone-500">{c.topics.length}</td>
                    <td className="px-4 py-3 text-stone-500">{quizCount || "—"}</td>
                    <td className="px-4 py-3 text-stone-500">{c.studentsCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5 whitespace-nowrap">
                        {status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(c, "approved")}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
                            >
                              <Check size={11} /> Approve
                            </button>
                            <button
                              onClick={() => setDenying({ course: c, isUpdate: false })}
                              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                            >
                              <Ban size={11} /> Deny
                            </button>
                          </>
                        )}
                        {c.revision?.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateReview(c, true)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
                            >
                              <Check size={11} /> Approve update
                            </button>
                            <button
                              onClick={() => setDenying({ course: c, isUpdate: true })}
                              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                            >
                              <Ban size={11} /> Deny update
                            </button>
                          </>
                        )}
                        {status === "denied" && (
                          <button
                            onClick={() => handleStatusChange(c, "approved")}
                            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                          >
                            <Check size={11} /> Approve anyway
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/courses/${c.id}/manage`)}
                          className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                        >
                          <Eye size={11} /> View content
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-4 text-center text-xs text-stone-400">No courses match this filter.</p>}
        </div>
      </div>

      {showForm && (
        <CourseFormModal onClose={() => setShowForm(false)} onCreated={(courseId) => navigate(`/admin/courses/${courseId}/manage`)} />
      )}
      {denying && (
        <DenyCourseModal
          course={denying.course}
          isUpdate={denying.isUpdate}
          onClose={() => setDenying(null)}
          onDeny={(reason) => {
            if (denying.isUpdate) handleUpdateReview(denying.course, false, reason);
            else handleStatusChange(denying.course, "denied", reason);
            setDenying(null);
          }}
        />
      )}
    </div>
  );
}
