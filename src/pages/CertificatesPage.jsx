import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Award, Download } from "lucide-react";
import Header from "../components/Header";
import CertificateView from "../components/CertificateView";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectCertificatesByUser } from "../store/slices/enrollmentsSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";

export default function CertificatesPage({ onMenuClick }) {
  const currentUser = useSelector(selectCurrentUser);
  const courses = useSelector(selectAllCourses);
  const completedEnrollments = useSelector((state) => selectCertificatesByUser(state, currentUser.id));
  const [viewing, setViewing] = useState(null);

  const certificates = completedEnrollments
    .map((e) => ({ enrollment: e, course: courses.find((c) => c.id === e.courseId) }))
    .filter(({ course }) => course?.certificate);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="My Certificates" subtitle="Earned once you complete a course that has a certificate enabled." onMenuClick={onMenuClick} />

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:p-8">
        {certificates.map(({ enrollment, course }) => (
          <div key={enrollment.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <Award size={22} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 leading-snug">{course.certificate.title}</h3>
            <p className="mt-1 text-xs text-stone-500">
              Completed {new Date(enrollment.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <div className="mt-auto flex gap-2 pt-4">
              <button
                onClick={() => setViewing({ enrollment, course })}
                className="flex-1 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
              >
                View certificate
              </button>
              <button
                onClick={() => setViewing({ enrollment, course })}
                title="Download (opens preview)"
                className="rounded-lg border border-stone-200 px-2.5 py-2 text-stone-500 hover:bg-stone-50"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}

        {certificates.length === 0 && (
          <p className="text-sm text-stone-400">
            No certificates yet — complete a course with a certificate enabled to see it here.
          </p>
        )}
      </div>

      {viewing && (
        <CertificateView
          learnerName={currentUser.name}
          courseTitle={viewing.course.title}
          issuer={viewing.course.certificate.issuer}
          completedAt={viewing.enrollment.completedAt}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
