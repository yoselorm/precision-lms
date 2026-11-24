import * as api from "../api/learning";
import { answersToApi } from "../api/normalize";

// Server timestamps come as ISO strings or "YYYY-MM-DD HH:MM:SS" (UTC).
export function parseServerTime(value) {
  if (!value) return null;
  const text = String(value);
  const time = new Date(/[TZ+]/.test(text.slice(10)) ? text : `${text.replace(" ", "T")}Z`).getTime();
  return Number.isFinite(time) ? time : null;
}

const ownerOf = ({ topicId, lessonId, courseId, classId }) =>
  topicId ? { type: "topic", id: topicId } : lessonId ? { type: "lesson", id: lessonId } : courseId ? { type: "course", id: courseId } : { type: "class", id: classId };

// One start per quiz at a time (React may mount the quiz page twice).
const starting = new Map();

// Opening a quiz page shouldn't use up an attempt each time: if the learner
// already has an unfinished attempt (and, for a timed quiz, time left on
// it), carry on with that one; only otherwise start a new one.
async function startOrResume(target, quiz) {
  const owner = ownerOf(target);
  const history = await api.listQuizAttempts(owner).catch(() => []);
  const open = history.find((a) => !a.submitted_at && (a.score === null || a.score === undefined));
  if (open) {
    const startedAt = parseServerTime(open.started_at);
    const limitMs = (quiz.timeLimitMins || 0) * 60000;
    if (!limitMs || (startedAt && Date.now() - startedAt < limitMs - 5000)) return open;
  }
  return api.startQuizAttempt(target);
}

// QuizTaker's startAttempt/submitAttempt for a course, topic, lesson or
// class quiz (target: { courseId | topicId | lessonId | classId }).
// Failures resolve to { error } / null rather than throwing, so the taker
// can show the server's message (e.g. "All allowed attempts already used").
export function quizAttemptHandlers(target, quiz, onError) {
  const key = JSON.stringify(ownerOf(target));
  return {
    startAttempt: () => {
      if (!starting.has(key)) {
        starting.set(
          key,
          startOrResume(target, quiz)
            .catch((err) => ({ error: err.message }))
            .finally(() => setTimeout(() => starting.delete(key), 1000))
        );
      }
      return starting.get(key);
    },
    submitAttempt: (attemptId, answers) =>
      api.submitQuizAttempt(attemptId, answersToApi(quiz, answers)).catch((err) => {
        onError(err.message || "Couldn't submit the quiz.");
        return null;
      }),
  };
}
