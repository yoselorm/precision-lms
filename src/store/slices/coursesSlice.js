import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockCourses } from "../../data/mockData";

const initialState = {
  courses: mockCourses,
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    // Shell-only course creation — used by the admin and trainer "Add
    // course" forms. Topics/lessons/quizzes are added afterward via the
    // course-manage page. Admin-authored courses go live immediately;
    // trainer-authored ones sit as "pending" until an admin approves them
    // (mirrors how trainer signups themselves get approved).
    addCourse: {
      reducer(state, action) {
        state.courses.push(action.payload);
      },
      prepare({ title, category, mandatory, durationMins, price, description, certificateTitle, thumbnailImage, capstoneTitle, capstoneInstructions, creatorId, status }) {
        const id = `c-${nanoid(6)}`;
        return {
          payload: {
            id,
            title,
            category,
            mandatory: !!mandatory,
            durationMins: Number(durationMins) || 30,
            thumbnailColor: "#0f766e",
            thumbnailImage: thumbnailImage || `https://picsum.photos/seed/${id}/480/300`,
            studentsCount: 0,
            updatedDate: new Date().toISOString().slice(0, 10),
            price: Number(price) || 0,
            certificate: certificateTitle ? { title: certificateTitle, issuer: "Learning & Development" } : null,
            capstone: capstoneTitle ? { title: capstoneTitle, instructions: capstoneInstructions || "" } : null,
            description: description || "",
            topics: [],
            createdBy: creatorId || null,
            status: status || "approved",
          },
        };
      },
    },

    // Bare-bones course, created inline from the "set up a class" flow when
    // there's no existing course to attach — materials get added afterward
    // via the topic/lesson reducers below. Same approval rule as addCourse.
    createBlankCourse: {
      reducer(state, action) {
        state.courses.push(action.payload);
      },
      prepare({ title, category, thumbnailImage, creatorId, status }) {
        const id = `c-${nanoid(6)}`;
        return {
          payload: {
            id,
            title,
            category: category || "Technical Skills",
            mandatory: false,
            durationMins: 0,
            thumbnailColor: "#0f766e",
            thumbnailImage: thumbnailImage || `https://picsum.photos/seed/${id}/480/300`,
            studentsCount: 0,
            updatedDate: new Date().toISOString().slice(0, 10),
            price: 0,
            certificate: null,
            capstone: null,
            description: "",
            topics: [],
            createdBy: creatorId || null,
            status: status || "approved",
          },
        };
      },
    },

    // Admin approves or denies a trainer-submitted course, controlling
    // whether it's visible in the public course catalog.
    setCourseStatus(state, action) {
      const { courseId, status } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (course) course.status = status;
    },

    // Trainer or admin adding a new topic to a course — used both from
    // Admin > Courses manage page and from a trainer managing their class's
    // materials.
    addTopicToCourse: {
      reducer(state, action) {
        const { courseId, topic } = action.payload;
        const course = state.courses.find((c) => c.id === courseId);
        if (!course) return;
        course.topics.push(topic);
      },
      prepare({ courseId, title }) {
        return {
          payload: {
            courseId,
            topic: {
              id: `${courseId}-t${nanoid(6)}`,
              title,
              lessons: [],
              quiz: null,
            },
          },
        };
      },
    },

    removeTopicFromCourse(state, action) {
      const { courseId, topicId } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return;
      course.topics = course.topics.filter((t) => t.id !== topicId);
    },

    // Adds a video/text/document lesson to an existing topic.
    addLessonToTopic: {
      reducer(state, action) {
        const { courseId, topicId, lesson } = action.payload;
        const course = state.courses.find((c) => c.id === courseId);
        const topic = course?.topics.find((t) => t.id === topicId);
        if (!topic) return;
        topic.lessons.push(lesson);
        course.durationMins += lesson.durationMins;
      },
      prepare({ courseId, topicId, title, type, durationMins, videoUrl, body, fileUrl }) {
        return {
          payload: {
            courseId,
            topicId,
            lesson: {
              id: `${topicId}-l${nanoid(6)}`,
              title,
              type,
              durationMins: Number(durationMins) || 10,
              videoUrl: type === "video" ? videoUrl || "" : undefined,
              body: type === "text" ? body || "" : undefined,
              fileUrl: type === "document" ? fileUrl || "" : undefined,
            },
          },
        };
      },
    },

    removeLessonFromTopic(state, action) {
      const { courseId, topicId, lessonId } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      const topic = course?.topics.find((t) => t.id === topicId);
      if (!topic) return;
      const lesson = topic.lessons.find((l) => l.id === lessonId);
      if (lesson) course.durationMins -= lesson.durationMins;
      topic.lessons = topic.lessons.filter((l) => l.id !== lessonId);
    },

    // Admin sets (or edits) the capstone project brief for an existing course.
    setCourseCapstone(state, action) {
      const { courseId, title, instructions } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return;
      course.capstone = title ? { title, instructions: instructions || "" } : null;
    },

    // Admin/trainer authors or edits a topic's quiz via QuizBuilder —
    // replaces the quiz wholesale since the builder always submits the full
    // working set of questions.
    setTopicQuiz(state, action) {
      const { courseId, topicId, passingScore, timeLimitMins, questions } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      const topic = course?.topics.find((t) => t.id === topicId);
      if (!topic) return;
      topic.quiz = {
        passingScore: Number(passingScore) || 70,
        timeLimitMins: Number(timeLimitMins) || null,
        questions: questions || [],
      };
    },
  },
});

export const {
  addCourse,
  createBlankCourse,
  setCourseStatus,
  addTopicToCourse,
  removeTopicFromCourse,
  addLessonToTopic,
  removeLessonFromTopic,
  setCourseCapstone,
  setTopicQuiz,
} = coursesSlice.actions;
export default coursesSlice.reducer;

export const selectAllCourses = (state) => state.courses.courses;
export const selectCourseById = (state, courseId) =>
  state.courses.courses.find((c) => c.id === courseId);
// The public-facing catalog only ever shows approved courses — trainer
// submissions stay invisible to learners until an admin reviews them.
export const selectPublicCourses = (state) =>
  state.courses.courses.filter((c) => (c.status || "approved") === "approved");
export const selectCoursesByCreator = (state, creatorId) =>
  state.courses.courses.filter((c) => c.createdBy === creatorId);
export const selectPendingCourses = (state) =>
  state.courses.courses.filter((c) => c.status === "pending");
