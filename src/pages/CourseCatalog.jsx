import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import Header from "../components/Header";
import CourseCard from "../components/CourseCard";
import { selectPublicCourses } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectEnrollmentsByUser } from "../store/slices/enrollmentsSlice";

export default function CourseCatalog({ onMenuClick }) {
  // Only approved courses are ever shown here — this is the catalog the
  // public and every learner sees, so trainer submissions awaiting review
  // stay invisible until an admin approves them.
  const courses = useSelector(selectPublicCourses);
  const currentUser = useSelector(selectCurrentUser);
  const enrollments = useSelector((state) => (currentUser ? selectEnrollmentsByUser(state, currentUser.id) : []));
  const enrollmentByCourseId = Object.fromEntries(enrollments.map((e) => [e.courseId, e]));

  const [query, setQuery] = useState("");
  // The landing page links straight into a category via ?category=…
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "All");

  const categories = useMemo(() => ["All", ...new Set(courses.map((c) => c.category))], [courses]);

  const filtered = courses.filter((c) => {
    const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || c.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header
        title="Course Catalog"
        subtitle={currentUser ? "Browse everything available to you." : "Browse our full course catalog — sign up to start learning."}
        onMenuClick={onMenuClick}
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus-within:border-brand-600">
            <Search size={16} className="text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-transparent outline-none placeholder:text-stone-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  category === cat
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} enrollment={enrollmentByCourseId[course.id]} />
          ))}
        </div>

        {filtered.length === 0 && <p className="text-center text-sm text-stone-400">No courses match your search.</p>}
      </div>
    </div>
  );
}
