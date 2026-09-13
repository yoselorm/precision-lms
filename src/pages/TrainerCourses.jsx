import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, Settings2, Clock, Ban, CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import CourseFormModal from "../components/CourseFormModal";
import { selectCoursesByCreator } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";

const STATUS_META = {
  approved: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Approved" },
  pending: { pill: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pending approval" },
  denied: { pill: "bg-stone-100 text-stone-500 border-stone-200", icon: Ban, label: "Denied" },
};

export default function TrainerCourses({ onMenuClick }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const courses = useSelector((state) => selectCoursesByCreator(state, currentUser.id));
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Courses" subtitle="Courses you've authored — new ones need admin approval before learners can see them." onMenuClick={onMenuClick} />

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
                      </td>
                      <td className="px-4 py-3 text-stone-500">{c.topics.length}</td>
                      <td className="px-4 py-3 text-stone-500">{quizCount || "—"}</td>
                      <td className="px-4 py-3 text-stone-500">{c.studentsCount}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/trainer/courses/${c.id}/manage`)}
                          className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                        >
                          <Settings2 size={11} /> Manage
                        </button>
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
