import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Download, ChevronDown, ChevronRight } from "lucide-react";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import StatusBadge, { isOverdue } from "../components/StatusBadge";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectEnrollmentsByUser } from "../store/slices/enrollmentsSlice";

function TeamMemberRow({ member }) {
  const [expanded, setExpanded] = useState(false);
  const courses = useSelector(selectAllCourses);
  const enrollments = useSelector((state) => selectEnrollmentsByUser(state, member.id));

  const completed = enrollments.filter((e) => e.status === "completed").length;
  const overdue = enrollments.filter((e) => isOverdue(e.dueDate, e.status)).length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-stone-50 transition"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: member.avatarColor }}
            >
              {member.name.split(" ").map((n) => n[0]).join("")}
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-semibold text-stone-800 leading-tight">{member.name}</p>
            <p className="text-[11px] text-stone-400 leading-tight">{member.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-32">
            <ProgressBar value={avgProgress} heightClass="h-1.5" />
          </div>
          <span className="w-10 text-right text-xs font-mono text-stone-500">{avgProgress}%</span>
          <span className="w-16 text-xs text-stone-500">{completed} done</span>
          {overdue > 0 ? (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
              {overdue} overdue
            </span>
          ) : (
            <span className="w-16" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-stone-100 border-t border-stone-100 px-4">
          {enrollments.map((e) => {
            const course = courses.find((c) => c.id === e.courseId);
            return (
              <div key={e.id} className="flex items-center justify-between py-2.5 text-xs">
                <span className="font-medium text-stone-700">{course?.title}</span>
                <div className="flex items-center gap-4">
                  <div className="w-28">
                    <ProgressBar value={e.progress} heightClass="h-1.5" />
                  </div>
                  <StatusBadge status={isOverdue(e.dueDate, e.status) ? "overdue" : e.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TeamPage({ onMenuClick }) {
  const allUsers = useSelector(selectAllUsers);
  const team = allUsers.filter((u) => u.role === "learner");

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header
        title="My Team"
        subtitle={`${team.length} learners across the org`}
        onMenuClick={onMenuClick}
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">
            <Download size={13} />
            Export CSV
          </button>
        </div>

        <div className="space-y-3">
          {team.map((member) => (
            <TeamMemberRow key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}
