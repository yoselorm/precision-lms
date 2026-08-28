import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockCourses } from "../../data/mockData";

const initialState = {
  courses: mockCourses,
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    // Full course creation — used by the admin "Add course" form. Accepts a
    // ready-built modules array (each with its own video/text content) and a
    // chosen thumbnail, rather than auto-generating placeholders.
    addCourse: {
      reducer(state, action) {
        state.courses.push(action.payload);
      },
      prepare({ title, category, mandatory, durationMins, price, description, certificateTitle, thumbnailImage, modules, capstoneTitle, capstoneInstructions, quiz }) {
        const id = `c-${nanoid(6)}`;
        const builtModules = (modules && modules.length > 0 ? modules : [{ title: "Introduction", type: "video", durationMins: 10 }]).map(
          (m, i) => ({
            id: `${id}-m${i + 1}`,
            title: m.title || `Topic ${i + 1}`,
            type: m.type || "video",
            durationMins: Number(m.durationMins) || 10,
            videoUrl: m.type === "video" ? m.videoUrl || "" : undefined,
            body: m.type === "reading" ? m.body || "" : undefined,
          })
        );
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
            modules: builtModules,
            quiz: quiz && quiz.questions?.length ? quiz : { passingScore: quiz?.passingScore || 70, questions: [] },
          },
        };
      },
    },

    // Bare-bones course, created inline from the "set up a class" flow when
    // there's no existing course to attach — materials get added afterward
    // via addModuleToCourse.
    createBlankCourse: {
      reducer(state, action) {
        state.courses.push(action.payload);
      },
      prepare({ title, category, thumbnailImage }) {
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
            modules: [],
            quiz: { passingScore: 70, questions: [] },
          },
        };
      },
    },

    // Trainer or admin adding a new topic (video or text) to a course that
    // already exists — used both from Admin > Courses and from a trainer
    // managing their class's materials.
    addModuleToCourse: {
      reducer(state, action) {
        const { courseId, module } = action.payload;
        const course = state.courses.find((c) => c.id === courseId);
        if (!course) return;
        course.modules.push(module);
        course.durationMins += module.durationMins;
      },
      prepare({ courseId, title, type, durationMins, videoUrl, body }) {
        return {
          payload: {
            courseId,
            module: {
              id: `${courseId}-m${nanoid(6)}`,
              title,
              type,
              durationMins: Number(durationMins) || 10,
              videoUrl: type === "video" ? videoUrl || "" : undefined,
              body: type === "reading" ? body || "" : undefined,
            },
          },
        };
      },
    },
    // Admin sets (or edits) the capstone project brief for an existing course.
    setCourseCapstone(state, action) {
      const { courseId, title, instructions } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return;
      course.capstone = title ? { title, instructions: instructions || "" } : null;
    },
    // Admin/trainer authors or edits a course's quiz via QuizBuilder —
    // replaces the quiz wholesale since the builder always submits the full
    // working set of questions.
    setCourseQuiz(state, action) {
      const { courseId, passingScore, timeLimitMins, questions } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return;
      course.quiz = {
        passingScore: Number(passingScore) || 70,
        timeLimitMins: Number(timeLimitMins) || null,
        questions: questions || [],
      };
    },
  },
});

export const { addCourse, createBlankCourse, addModuleToCourse, setCourseCapstone, setCourseQuiz } = coursesSlice.actions;
export default coursesSlice.reducer;

export const selectAllCourses = (state) => state.courses.courses;
export const selectCourseById = (state, courseId) =>
  state.courses.courses.find((c) => c.id === courseId);
