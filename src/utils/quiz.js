// Pure helpers shared by anywhere a quiz gets graded or timed — course
// quizzes (CoursePlayer) and class quizzes (ClassDetailPage) both use these.
export function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Session quiz results are kept per quiz under this key (topic quizzes use
// the bare topic id, as before).
export const quizKey = (owner) => (owner.type === "topic" ? owner.id : `${owner.type}:${owner.id}`);

// Where a learner takes each kind of course quiz.
export const quizRoute = (courseId, owner) =>
  owner.type === "course"
    ? `/course/${courseId}/quiz`
    : owner.type === "lesson"
    ? `/course/${courseId}/lesson/${owner.id}/quiz`
    : `/course/${courseId}/topic/${owner.id}/quiz`;
