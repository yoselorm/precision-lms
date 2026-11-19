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
    sortOrder: l.sort_order ?? 0,
    // Not modelled by the API — kept so lesson UIs that list extra
    // downloads still render.
    resources: [],
  };
}

// Lessons nested in a course's topics don't always come back sorted, so
// order by sort_order here (stable, so ties keep the server's order).
const bySortOrder = (a, b) => a.sortOrder - b.sortOrder;

export function normalizeTopic(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description || "",
    sortOrder: t.sort_order ?? 0,
    lessons: (t.lessons || []).map(normalizeLesson).sort(bySortOrder),
    quiz: null,
  };
}

const lessonMinutes = (topics) => topics.reduce((sum, t) => sum + t.lessons.reduce((s, l) => s + (l.durationMins || 0), 0), 0);

// Courses without an uploaded thumbnail get a generated cover: a gradient in
// the course's colour (or one picked from the brand palette by id) with a
// soft pattern, the category and the title. It's an inline SVG, so every
// <img src={course.thumbnailImage}> renders it with no extra request.
const COVER_PALETTE = ["#21409A", "#0f766e", "#7c3aed", "#b45309", "#be123c", "#0369a1", "#15803d"];
const COVER_PREFIX = "data:image/svg+xml;utf8,";
const COVER_MARKER = "lms-generated-cover";

const escapeXml = (text) => String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]);

// Darkens a #rrggbb colour by `amount` (0–1) for the gradient's far end.
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.max(0, Math.round(((n >> shift) & 255) * (1 - amount)));
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

// Splits a title into at most two lines of ~22 characters, with an ellipsis
// if it runs longer.
function titleLines(title, max = 22) {
  const lines = [""];
  for (const word of String(title).split(/\s+/)) {
    const current = lines[lines.length - 1];
    if (!current || (current + " " + word).length <= max) lines[lines.length - 1] = current ? `${current} ${word}` : word;
    else if (lines.length < 2) lines.push(word);
    else {
      lines[1] = `${lines[1].slice(0, max - 1).trimEnd()}…`;
      break;
    }
  }
  return lines.map((line) => (line.length > max + 2 ? `${line.slice(0, max)}…` : line));
}

export function generatedCover({ id, title, category, color }) {
  const hash = [...String(id)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const base = /^#[0-9a-f]{6}$/i.test(color || "") ? color : COVER_PALETTE[hash % COVER_PALETTE.length];
  const lines = titleLines(title);
  const titleY = lines.length === 1 ? 214 : 190;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300" data-${COVER_MARKER}="1">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, 0.45)}"/></linearGradient>
<pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="22" stroke="#fff" stroke-opacity="0.07" stroke-width="8"/></pattern></defs>
<rect width="480" height="300" fill="url(#g)"/><rect width="480" height="300" fill="url(#p)"/>
<circle cx="420" cy="40" r="110" fill="#fff" fill-opacity="0.08"/><circle cx="455" cy="250" r="60" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="10"/>
<rect x="32" y="36" width="${Math.min(320, 30 + String(category).length * 9.5)}" height="28" rx="14" fill="#fff" fill-opacity="0.18"/>
<text x="46" y="55" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" fill="#fff" letter-spacing="0.5">${escapeXml(String(category).toUpperCase())}</text>
${lines
  .map((line, i) => `<text x="32" y="${titleY + i * 40}" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="800" fill="#fff">${escapeXml(line)}</text>`)
  .join("")}
</svg>`;
  return `${COVER_PREFIX}${encodeURIComponent(svg)}`;
}

export const isPlaceholderThumbnail = (url) => !url || (url.startsWith(COVER_PREFIX) && url.includes(COVER_MARKER));

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
    thumbnailImage:
      c.thumbnail_image ||
      generatedCover({ id: c.id, title: c.title, category: c.category?.name || "Course", color: c.thumbnail_color }),
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
    // null when the response leaves it out (the enrollment list does) —
    // callers keep what they already knew rather than clearing it.
    completedModuleIds: e.completed_lesson_ids ?? null,
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
    submissionsCount: a.submissions_count ?? null,
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
  // A saved design has elements, or at least a background (an uploaded
  // template with nothing placed on it yet).
  const hasDesign = (Array.isArray(c.template?.elements) && c.template.elements.length > 0) || !!c.template?.background;
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
