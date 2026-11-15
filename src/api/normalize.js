// Maps the API's snake_case resources onto the camelCase shapes the pages
// were built around (the same shapes the old mock data used), and back again
// for request bodies. Keeping this in one place means pages don't need to
// know which fields came from the server and which are derived.

const day = (value) => (value ? String(value).slice(0, 10) : null);

// Inline SVG initials avatar for accounts without an uploaded photo, so
// <img src={user.avatarUrl}> never renders broken.
function initialsAvatar(name, color) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="${color}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" font-weight="600" fill="#fff">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// UserResource / AdminResource. Admins have no `role` on the backend — their
// guard is what makes them admins.
export function normalizeUser(apiUser, guard = "user") {
  if (!apiUser) return null;
  const avatarColor = apiUser.avatar_color || "#57534e";
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: guard === "admin" ? "admin" : apiUser.role,
    department: apiUser.department ?? null,
    managerId: apiUser.manager_id ?? null,
    status: guard === "admin" ? "approved" : apiUser.status,
    avatarColor,
    avatarUrl: apiUser.avatar_url || initialsAvatar(apiUser.name, avatarColor),
    points: apiUser.points ?? 0,
    streakDays: apiUser.streak_days ?? 0,
    permissions: apiUser.permissions ?? [],
    createdAt: apiUser.created_at ?? null,
  };
}

// Lightweight { id, name, avatar_url } stubs embedded in comments,
// submissions and classes.
export function normalizeUserStub(stub) {
  if (!stub?.id) return null;
  return { id: stub.id, name: stub.name || "Unknown", avatarUrl: stub.avatar_url || initialsAvatar(stub.name, "#57534e") };
}

// ── Courses ──

export function normalizeLesson(l) {
  return {
    id: l.id,
    title: l.title,
    description: l.description || "",
    type: l.type,
    durationMins: l.duration_mins || 0,
    videoUrl: l.video_url || "",
    body: l.body || "",
    fileUrl: l.file_url || "",
    // Not modelled by the API — kept so lesson UIs that list extra
    // downloads still render.
    resources: [],
  };
}

export function normalizeTopic(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description || "",
    lessons: (t.lessons || []).map(normalizeLesson),
    quiz: null,
  };
}

const lessonMinutes = (topics) => topics.reduce((sum, t) => sum + t.lessons.reduce((s, l) => s + (l.durationMins || 0), 0), 0);

// AdminCourseResource / UserCourseResource. Topics, revision and certificate
// are loaded separately and merged in by the courses slice.
export function normalizeCourse(c) {
  return {
    id: c.id,
    title: c.title,
    category: c.category?.name || "Uncategorised",
    categoryId: c.category?.id || null,
    durationMins: c.duration_mins || 0,
    thumbnailColor: c.thumbnail_color || "#0f766e",
    thumbnailImage: c.thumbnail_image || `https://picsum.photos/seed/${c.id}/480/300`,
    demoVideoUrl: c.demo_video_url || "",
    // Not returned by the API yet.
    studentsCount: 0,
    updatedDate: day(c.updated_at || c.created_at),
    price: c.price || 0,
    description: c.description || "",
    status: c.status,
    createdBy: c.created_by || null,
    certificate: null,
    review: null,
    revision: null,
    topics: [],
    // "idle" until the course's topics have been requested.
    contentStatus: "idle",
  };
}

// `topics` are already normalized (see normalizeTopic).
export function withTopics(course, topics) {
  return { ...course, topics, durationMins: course.durationMins || lessonMinutes(topics) };
}

export function normalizeRevision(r) {
  if (!r) return null;
  return {
    id: r.id,
    status: r.status,
    review: r.review_reason ? { reason: r.review_reason, deniedAt: r.updated_at } : null,
    topics: (r.topics || []).map(normalizeTopic),
  };
}

// Course/lesson form fields -> request body.
export function courseToApi({ title, categoryId, price, description, thumbnailImage, thumbnailColor, demoVideoUrl, createdBy }) {
  const body = {
    title,
    category_id: categoryId,
    price: Number(price) || 0,
    description: description || null,
    thumbnail_image: thumbnailImage || null,
    thumbnail_color: thumbnailColor || null,
    demo_video_url: demoVideoUrl || null,
  };
  if (createdBy !== undefined) body.created_by = createdBy || null;
  return body;
}

export function lessonToApi({ title, description, type, durationMins, videoUrl, body, fileUrl }) {
  return {
    title,
    description: description || null,
    type,
    duration_mins: Number(durationMins) || 10,
    video_url: type === "video" ? videoUrl || null : null,
    body: type === "text" ? body || null : null,
    file_url: type === "document" ? fileUrl || null : null,
  };
}

// ── Quizzes ──
// The UI works with options as plain labels and `correct` as option indexes.
// Option/question ids are kept alongside so attempts can be submitted.

export function normalizeQuiz(q) {
  if (!q) return null;
  return {
    id: q.id,
    title: q.title || "",
    passingScore: q.passing_score ?? 70,
    timeLimitMins: q.time_limit_mins ?? null,
    maxAttempts: q.max_attempts ?? null,
    showAnswers: q.show_answers !== false,
    questions: (q.questions || []).map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options.map((o) => o.label),
      optionIds: question.options.map((o) => o.id),
      // Only present in the authoring (owner/admin) response.
      correct: question.options.flatMap((o, i) => (o.is_correct ? [i] : [])),
    })),
    // The learner-facing read never says which options are right.
    answersKnown: (q.questions || []).some((question) => question.options.some((o) => "is_correct" in o)),
  };
}

export function quizToApi({ title, passingScore, timeLimitMins, maxAttempts, showAnswers, questions }) {
  return {
    title: title?.trim() || null,
    passing_score: Number(passingScore) || 70,
    time_limit_mins: Number(timeLimitMins) || null,
    max_attempts: Number(maxAttempts) || null,
    show_answers: showAnswers !== false,
    questions: (questions || []).map((question, qi) => ({
      type: question.type,
      prompt: question.prompt,
      sort_order: qi,
      options: question.options.map((label, oi) => ({
        label,
        is_correct: (question.correct || []).includes(oi),
        sort_order: oi,
      })),
    })),
  };
}

// UI answers ({ [questionId]: [optionIndex] }) -> attempt submission.
export function answersToApi(quiz, answers) {
  return quiz.questions.map((question) => ({
    question_id: question.id,
    selected_option_ids: (answers[question.id] || []).map((oi) => question.optionIds[oi]),
  }));
}

// ── Learning ──

export function normalizeEnrollment(e, userId) {
  return {
    id: e.id,
    userId,
    courseId: e.course?.id,
    status: e.status,
    progress: e.progress || 0,
    dueDate: day(e.due_date),
    completedAt: day(e.completed_at),
    completedModuleIds: e.completed_lesson_ids || [],
    topicQuizzes: {},
  };
}

export function normalizeClass(c) {
  return {
    id: c.id,
    title: c.title,
    description: c.description || "",
    trainerId: c.trainer?.id || null,
    trainerName: c.trainer?.name || null,
    // The API doesn't return the mandatory flag on a class's courses yet.
    courses: c.courses ? c.courses.map((course) => ({ courseId: course.id, mandatory: false })) : null,
    // Rosters aren't exposed — only a count.
    memberIds: [],
    memberCount: c.member_count ?? 0,
    startDate: day(c.start_date),
    endDate: day(c.end_date),
    status: c.status,
    quiz: null,
  };
}

export function normalizeAssignment(a) {
  return {
    id: a.id,
    classId: a.school_class_id || null,
    courseId: a.course_id || null,
    title: a.title,
    instructions: a.instructions || "",
    dueDate: day(a.due_date),
    createdAt: day(a.created_at),
    createdBy: a.created_by || null,
    status: a.status,
    autoCloseOnDueDate: !!a.auto_close_on_due_date,
  };
}

export function normalizeSubmission(s) {
  const user = normalizeUserStub(s.user);
  return {
    id: s.id,
    type: "assignment",
    refId: s.assignment_id,
    userId: user?.id || null,
    userName: user?.name || null,
    fileName: s.file_name,
    fileSize: s.file_size,
    fileUrl: s.file_url,
    submittedAt: s.submitted_at,
    status: s.status,
    grade: s.grade || null,
    feedback: s.feedback || null,
  };
}

export function normalizeComment(c) {
  const user = normalizeUserStub(c.user);
  return {
    id: c.id,
    topicId: c.topic_id,
    userId: user?.id || null,
    user,
    text: c.text,
    createdAt: c.created_at,
  };
}

// The designer's template background is an object ({ color, image, border,
// borderColor }) but the API stores `background` as a string, so it
// round-trips as JSON.
function parseBackground(background) {
  if (!background || typeof background !== "string") return background || undefined;
  try {
    return JSON.parse(background);
  } catch {
    return { color: background, image: "", border: true, borderColor: "#21409A" };
  }
}

export function normalizeCertificate(c) {
  const hasDesign = Array.isArray(c.template?.elements) && c.template.elements.length > 0;
  return {
    id: c.id,
    courseId: c.course_id || null,
    title: c.title,
    issuer: c.issuer,
    signatoryName: c.signatory_name || "",
    signatoryTitle: c.signatory_title || "",
    // null falls back to the default layout (see getTemplate).
    template: hasDesign ? { ...c.template, background: parseBackground(c.template.background) } : null,
  };
}

export function templateToApi(template) {
  if (!template) return { background: null, elements: [] };
  const { background, elements } = template;
  return { background: background && typeof background === "object" ? JSON.stringify(background) : background || null, elements: elements || [] };
}
