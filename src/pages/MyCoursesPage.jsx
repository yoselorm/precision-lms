import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BookOpen } from "lucide-react";
import Header from "../components/Header";
import CourseCard from "../components/CourseCard";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectEnrollmentsByUser } from "../store/slices/enrollmentsSlice";

export default function MyCoursesPage({ onMenuClick }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const courses = useSelector(selectAllCourses);
  const enrollments = useSelector((state) => selectEnrollmentsByUser(state, currentUser.id));

  const enrollmentByCourseId = Object.fromEntries(enrollments.map((e) => [e.courseId, e]));
  const enrolledCourses = courses.filter((c) => enrollmentByCourseId[c.id]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="My Courses" subtitle="Everything you're currently enrolled in." onMenuClick={onMenuClick} />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map((course) => (
              <CourseCard key={course.id} course={course} enrollment={enrollmentByCourseId[course.id]} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <BookOpen size={22} className="text-stone-400" />
            </div>
            <p className="text-sm font-semibold text-stone-700">You haven't enrolled in anything yet.</p>
            <p className="max-w-sm text-xs text-stone-400">Browse the catalog and enroll in a course to see it here.</p>
            <button
              onClick={() => navigate("/catalog")}
              className="mt-2 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
            >
              Browse catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
