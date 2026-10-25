import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Clock, Ban, CheckCircle2, Circle, PencilLine, Send, Trash2, Radio, Undo2 } from "lucide-react";
import Header from "../components/Header";
import CourseTopicsManager from "../components/CourseTopicsManager";
import {
  selectCourseById,
  setCourseStatus,
  submitCourseUpdate,
  discardCourseUpdate,
  editableTopicsOf,
} from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { pushToast } from "../store/slices/uiSlice";
import { confirmDeleteCourse } from "./TrainerCourses";
import { useConfirm } from "../components/ConfirmDialog";

// What a course (or an update to a live one) needs before it can go to an
// admin for approval.
function getReadinessChecks(topics) {
  return [
    { label: "Add at least one topic", done: topics.length > 0 },
    {
      label: "Give every topic at least one lesson",
      done: topics.length > 0 && topics.every((t) => t.lessons.length > 0),
    },
  ];
}

function Checklist({ checks }) {
  return (
    <ul className="mt-4 space-y-2">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-2 text-xs font-medium text-stone-700">
          {c.done ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Circle size={15} className="text-stone-300" />}
          <span className={c.done ? "text-stone-500 line-through" : ""}>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}

function FeedbackBox({ review }) {
  if (!review?.reason) return null;
  return (
    <div className="mt-3 rounded-xl border border-rose-200 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
        Admin feedback
        {review.deniedAt && ` · ${new Date(review.deniedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{review.reason}</p>
    </div>
  );
}

// Shown to the trainer on a course that's already live: edits are saved as
// an update that learners don't see until an admin approves it.
function LiveUpdatePanel({ course, onSubmit, onDiscard }) {
  const revision = course.revision;
  if (!revision) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
        <Radio size={14} className="mt-0.5 shrink-0" />
        <span>
          This course is live. Any changes you make below are saved as an update — learners keep seeing the current version until an
          admin approves it.
        </span>
      </div>
    );
  }

  const checks = getReadinessChecks(revision.topics);
  const ready = checks.every((c) => c.done);
  const tone =
    revision.status === "pending"
      ? { box: "border-amber-200 bg-amber-50/60", text: "text-amber-900", Icon: Clock, title: "Update awaiting admin approval" }
      : revision.status === "denied"
      ? { box: "border-rose-200 bg-rose-50/60", text: "text-rose-800", Icon: Ban, title: "Update denied — make changes and resubmit it" }
      : { box: "border-blue-200 bg-blue-50/60", text: "text-blue-900", Icon: PencilLine, title: "You have unpublished changes" };
  const Icon = tone.Icon;

  return (
    <div className={`rounded-2xl border p-5 ${tone.box}`}>
      <div className={`flex items-center gap-2 text-sm font-bold ${tone.text}`}>
        <Icon size={15} /> {tone.title}
      </div>
      {revision.status === "denied" && <FeedbackBox review={revision.review} />}
      <p className={`mt-3 text-xs ${tone.text}`}>
        {revision.status === "pending"
          ? "Learners still see the current version. You can keep editing — your changes stay in the review queue."
          : "Learners still see the current version. Submit your update for approval when it's ready."}
      </p>
      <Checklist checks={checks} />
      <div className="mt-5 flex flex-wrap gap-2">
        {revision.status !== "pending" && (
          <button
            onClick={onSubmit}
            disabled={!ready}
            title={ready ? undefined : "Complete the checklist first"}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={13} /> Submit update for approval
          </button>
        )}
        <button
          onClick={onDiscard}
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          <Undo2 size={13} /> Discard changes
        </button>
      </div>
    </div>
  );
}

function DeleteCourseButton({ onDelete }) {
  return (
    <button
      onClick={onDelete}
      className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
    >
      <Trash2 size={13} /> Delete course
    </button>
  );
}

function DraftChecklist({ course, onSaveDraft, onSubmit, onDelete }) {
  const checks = getReadinessChecks(course.topics);
  const ready = checks.every((c) => c.done);
  const denied = course.status === "denied";

  return (
    <div className={`rounded-2xl border p-5 ${denied ? "border-rose-200 bg-rose-50/60" : "border-blue-200 bg-blue-50/60"}`}>
      <div className={`flex items-center gap-2 text-sm font-bold ${denied ? "text-rose-800" : "text-blue-900"}`}>
        {denied ? <Ban size={15} /> : <PencilLine size={15} />}
        {denied ? "Denied — update this course and resubmit it" : "Draft — finish building this course"}
      </div>
      {denied && <FeedbackBox review={course.review} />}
      <p className={`mt-3 text-xs ${denied ? "text-rose-700" : "text-blue-800"}`}>
        Add your topics and lessons below. Your work is saved as you go, so you can come back and continue later. Submit
        it for approval once everything is in place.
      </p>

      <Checklist checks={checks} />

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onSaveDraft}
          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          Save draft &amp; exit
        </button>
        <button
          onClick={onSubmit}
          disabled={!ready}
          title={ready ? undefined : "Complete the checklist first"}
          className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={13} /> Submit for approval
        </button>
        <span className="ml-auto">
          <DeleteCourseButton onDelete={onDelete} />
        </span>
      </div>
    </div>
  );
}

// Shared by admins (any course, via /admin/courses/:id/manage) and trainers
// (their own courses only, via /trainer/courses/:id/manage) — same topic/
// lesson/quiz editing surface, just a different back link and ownership
// check depending on who's looking.
export default function CourseManagePage({ onMenuClick }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const currentUser = useSelector(selectCurrentUser);
  const course = useSelector((state) => selectCourseById(state, courseId));
  const [showProposed, setShowProposed] = useState(true);
  const isAdmin = currentUser.role === "admin";
  const backTo = isAdmin ? "/admin/courses" : "/trainer/courses";
  const backLabel = isAdmin ? "Back to courses" : "Back to my courses";
  // Admins oversee course content but don't author it — trainers do.

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

  const deleteCourse = async () => {
    if (await confirmDeleteCourse({ confirm, dispatch, course })) navigate(backTo);
  };

  const isLive = (course.status || "approved") === "approved";
  const viewingProposed = isAdmin && !!course.revision && showProposed;

  const saveDraft = async () => {
    const ok = await confirm({
      title: "Save draft and exit?",
      message: "Your course is saved as a draft. You can come back to it anytime from your courses.",
      confirmLabel: "Save draft",
    });
    if (!ok) return;
    dispatch(pushToast({ type: "success", message: "Draft saved — you can continue editing it anytime." }));
    navigate(backTo);
  };

  const submitForApproval = async () => {
    const ok = await confirm({
      title: "Submit for approval?",
      message: `"${course.title}" will be sent to an admin to review. You can keep editing it while it's pending.`,
      confirmLabel: "Submit for approval",
    });
    if (!ok) return;
    dispatch(setCourseStatus({ courseId: course.id, status: "pending" }));
    dispatch(pushToast({ type: "success", message: `"${course.title}" was submitted for admin approval.` }));
  };

  const submitUpdate = async () => {
    const ok = await confirm({
      title: "Submit this update for approval?",
      message: "An admin will review your changes. Learners keep seeing the current version until the update is approved.",
      confirmLabel: "Submit update",
    });
    if (!ok) return;
    dispatch(submitCourseUpdate({ courseId: course.id }));
    dispatch(pushToast({ type: "success", message: "Update submitted for admin approval." }));
  };

  const discardUpdate = async () => {
    const ok = await confirm({
      title: "Discard your changes?",
      message: "Your unpublished changes will be thrown away and the course goes back to its live version. This can't be undone.",
      confirmLabel: "Discard changes",
      tone: "danger",
    });
    if (!ok) return;
    dispatch(discardCourseUpdate({ courseId: course.id }));
    dispatch(pushToast({ type: "success", message: "Changes discarded." }));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header
        title={course.title}
        subtitle={isAdmin ? "Read-only view of this course's topics and lessons." : "Build this course's topics and lessons."}
        onMenuClick={onMenuClick}
      />

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate(backTo)} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> {backLabel}
        </button>

        {!isAdmin && course.status === "pending" && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 sm:flex-row sm:items-center">
            <span className="flex flex-1 items-center gap-2">
              <Clock size={14} className="shrink-0" /> Awaiting admin approval — learners won't see this course in the catalog until it's
              approved. You can keep editing it in the meantime.
            </span>
            <DeleteCourseButton onDelete={deleteCourse} />
          </div>
        )}
        {!isAdmin && (course.status === "draft" || course.status === "denied") && (
          <DraftChecklist
            course={course}
            onSaveDraft={saveDraft}
            onSubmit={submitForApproval}
            onDelete={deleteCourse}
          />
        )}
        {!isAdmin && isLive && <LiveUpdatePanel course={course} onSubmit={submitUpdate} onDiscard={discardUpdate} />}

        {isAdmin && (
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500">
            You're viewing this course as an admin. Course content is created and edited by its trainer.
          </div>
        )}
        {isAdmin && course.revision && (
          <div className="flex flex-wrap items-center gap-2">
            {[
              [false, "Live version"],
              [true, course.revision.status === "pending" ? "Proposed update (awaiting approval)" : "Trainer's unsubmitted changes"],
            ].map(([proposed, label]) => (
              <button
                key={label}
                onClick={() => setShowProposed(proposed)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  showProposed === proposed ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <CourseTopicsManager course={course} readOnly={isAdmin} useRevision={isAdmin ? viewingProposed : isLive} />
      </div>
    </div>
  );
}
