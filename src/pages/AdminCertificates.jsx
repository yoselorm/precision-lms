import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Award, Plus, X, Eye, Pencil, Trash2, Users, Palette } from "lucide-react";
import Header from "../components/Header";
import CertificateView from "../components/CertificateView";
import { selectAllCourses, setCourseCertificate } from "../store/slices/coursesSlice";
import { selectAllEnrollments } from "../store/slices/enrollmentsSlice";
import { pushToast } from "../store/slices/uiSlice";
import { useConfirm } from "../components/ConfirmDialog";

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

// Create a new certificate (pick any course that doesn't have one yet) or
// edit an existing one, in which case the linked course is fixed.
function CertificateFormModal({ courses, editing, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const available = courses.filter((c) => !c.certificate);
  const [form, setForm] = useState(() =>
    editing
      ? {
          courseId: editing.id,
          title: editing.certificate.title,
          issuer: editing.certificate.issuer || "",
        }
      : {
          courseId: available[0]?.id || "",
          title: available[0] ? `Certificate of Completion — ${available[0].title}` : "",
          issuer: "Learning & Development",
        }
  );

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const changeCourse = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    setForm((prev) => ({ ...prev, courseId, title: course ? `Certificate of Completion — ${course.title}` : prev.title }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.courseId || !form.title.trim()) return;
    const { courseId, ...certificate } = form;
    dispatch(setCourseCertificate({ courseId, certificate }));
    const course = courses.find((c) => c.id === courseId);
    dispatch(
      pushToast({
        type: "success",
        message: editing ? "Certificate updated." : `Certificate created and linked to "${course?.title}".`,
      })
    );
    onClose();
    if (!editing) navigate(`/admin/certificates/${courseId}/design`);
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">{editing ? "Edit certificate" : "Create a certificate"}</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Linked course</label>
            {editing ? (
              <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700">{editing.title}</p>
            ) : (
              <select value={form.courseId} onChange={(e) => changeCourse(e.target.value)} className={inputClass} required>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
            {!editing && (
              <p className="mt-1 text-[11px] text-stone-400">Learners earn this certificate when they complete the course.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Certificate title</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Issued by</label>
            <input
              value={form.issuer}
              onChange={(e) => update("issuer", e.target.value)}
              placeholder="e.g. Learning & Development"
              className={inputClass}
            />
          </div>
          {!editing && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-[11px] text-brand-800">
              Next you'll open the designer to lay out the certificate, add signatures and images.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            {editing ? "Save changes" : "Create certificate"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminCertificates({ onMenuClick }) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const courses = useSelector(selectAllCourses);
  const enrollments = useSelector(selectAllEnrollments);
  const [formState, setFormState] = useState(null); // { editing: course | null }
  const [previewing, setPreviewing] = useState(null);

  const certified = courses.filter((c) => c.certificate);
  const canCreate = courses.some((c) => !c.certificate);

  const removeCertificate = async (course) => {
    const ok = await confirm({
      title: "Remove this certificate?",
      message: `"${course.title}" will no longer award a certificate, and learners won't see it any more.`,
      confirmLabel: "Remove certificate",
      tone: "danger",
    });
    if (!ok) return;
    dispatch(setCourseCertificate({ courseId: course.id, certificate: null }));
    dispatch(pushToast({ type: "success", message: "Certificate removed." }));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Certificates" subtitle="Create certificates and link them to courses. Learners earn them on completion." onMenuClick={onMenuClick} />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-stone-500">
            {certified.length} of {courses.length} courses have a certificate
          </p>
          <button
            onClick={() => setFormState({ editing: null })}
            disabled={!canCreate}
            title={canCreate ? undefined : "Every course already has a certificate"}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} /> Create certificate
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certified.map((course) => {
            const earned = enrollments.filter((e) => e.courseId === course.id && e.status === "completed").length;
            return (
              <div key={course.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                    <Award size={20} className="text-brand-700" />
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                    <Users size={10} /> {earned} earned
                  </span>
                </div>
                <h3 className="text-sm font-bold leading-snug text-stone-900">{course.certificate.title}</h3>
                <p className="mt-1 text-xs text-stone-500">Issued by {course.certificate.issuer}</p>

                <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-stone-50 p-2">
                  <img src={course.thumbnailImage} alt="" className="h-9 w-14 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Linked course</p>
                    <p className="truncate text-xs font-semibold text-stone-800">{course.title}</p>
                  </div>
                </div>

                <div className="mt-auto flex gap-2 pt-4">
                  <button
                    onClick={() => navigate(`/admin/certificates/${course.id}/design`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                  >
                    <Palette size={13} /> Design
                  </button>
                  <button
                    onClick={() => setPreviewing(course)}
                    title="Preview & download"
                    className="rounded-lg border border-stone-200 px-2.5 py-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => setFormState({ editing: course })}
                    title="Edit title & issuer"
                    className="rounded-lg border border-stone-200 px-2.5 py-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeCertificate(course)}
                    title="Remove"
                    className="rounded-lg border border-stone-200 px-2.5 py-2 text-stone-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {certified.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
            No certificates yet. Create one and link it to a course.
          </div>
        )}
      </div>

      {formState && <CertificateFormModal courses={courses} editing={formState.editing} onClose={() => setFormState(null)} />}

      {previewing && (
        <CertificateView
          certificate={previewing.certificate}
          learnerName="Ama Boateng"
          courseTitle={previewing.title}
          completedAt={new Date().toISOString()}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
