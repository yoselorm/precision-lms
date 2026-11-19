import * as api from "../api/learning";
import { answersToApi } from "../api/normalize";

// QuizTaker's startAttempt/submitAttempt for a course, topic, lesson or
// class quiz (target: { courseId | topicId | lessonId | classId }).
// Failures resolve to { error } / null rather than throwing, so the taker
// can show the server's message (e.g. "All allowed attempts already used").
export function quizAttemptHandlers(target, quiz, onError) {
  return {
    startAttempt: () => api.startQuizAttempt(target).catch((err) => ({ error: err.message })),
    submitAttempt: (attemptId, answers) =>
      api.submitQuizAttempt(attemptId, answersToApi(quiz, answers)).catch((err) => {
        onError(err.message || "Couldn't submit the quiz.");
        return null;
      }),
  };
}
