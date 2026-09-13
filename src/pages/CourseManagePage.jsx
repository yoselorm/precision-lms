import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Clock, Ban } from "lucide-react";
import Header from "../components/Header";
import CourseTopicsManager from "../components/CourseTopicsManager";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";

// Shared by admins (any course, via /admin/courses/:id/manage) and trainers
// (their own courses only, via /trainer/courses/:id/manage) — same topic/
// lesson/quiz editing surface, just a different back link and ownership
// check depending on who's looking.
export default function CourseManagePage({ onMenuClick }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const course = useSelector((state) => selectCourseById(state, courseId));
  const isAdmin = currentUser.role === "admin";
  const backTo = isAdmin ? "/admin/courses" : "/trainer/courses";
  const backLabel = isAdmin ? "Back to courses" : "Back to my courses";

  if (!course) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        Course not found.{" "}
        <button className="ml-2 underline" onClick={() => navigate(backTo)}>
          {backLabel}
        </button>
      </div>
    );
  }

  if (!isAdmin && course.createdBy !== currentUser.id) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        You don't manage this course.{" "}
        <button className="ml-2 underline" onClick={() => navigate(backTo)}>
          {backLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={course.title} subtitle="Manage this course's topics, lessons, and quizzes." onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate(backTo)} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> {backLabel}
        </button>

        {!isAdmin && course.status === "pending" && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
            <Clock size={14} className="shrink-0" /> Awaiting admin approval — learners won't see this course in the catalog until it's approved.
            You can keep editing it in the meantime.
          </div>
        )}
        {!isAdmin && course.status === "denied" && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
            <Ban size={14} className="shrink-0" /> This course was denied by an admin and isn't visible to learners. You can still edit it —
            reach out to an admin to have it reconsidered.
          </div>
        )}

        <CourseTopicsManager course={course} />
      </div>
    </div>
  );
}
