// ---------------------------------------------------------------------------
// Placeholder data for the LMS demo. Nothing here hits a real API — this is
// what seeds the Redux store so the client can see the full experience
// before any backend exists.
// ---------------------------------------------------------------------------

export const mockUsers = [
  { id: "u1", name: "Ama Boateng", role: "learner", department: "Customer Success", avatarColor: "#16a34a", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=47", points: 1280, streakDays: 6, status: "approved" },
  { id: "u2", name: "Kojo Ansah", role: "learner", department: "Sales", avatarColor: "#2563eb", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=12", points: 1560, streakDays: 11, status: "approved" },
  { id: "u3", name: "Efua Owusu", role: "learner", department: "Operations", avatarColor: "#9333ea", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=32", points: 940, streakDays: 3, status: "approved" },
  { id: "u5", name: "Yaa Asante", role: "admin", department: "People & Culture", avatarColor: "#dc2626", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=45", points: 860, streakDays: 2, status: "approved" },
  { id: "u6", name: "Nana Adjei", role: "learner", department: "Sales", avatarColor: "#0891b2", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=14", points: 1720, streakDays: 9, status: "approved" },
  { id: "u7", name: "Abena Darko", role: "learner", department: "Marketing", avatarColor: "#db2777", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=25", points: 690, streakDays: 1, status: "approved" },
  { id: "u8", name: "Dr. Samuel Osei", role: "trainer", department: "Learning & Development", avatarColor: "#0f766e", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=59", points: 0, streakDays: 0, status: "approved" },
  { id: "u9", name: "Linda Appiah", role: "trainer", department: "Learning & Development", avatarColor: "#7c3aed", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=48", points: 0, streakDays: 0, status: "approved" },
  { id: "u10", name: "Joseph Nkrumah", role: "trainer", department: "Learning & Development", avatarColor: "#ca8a04", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=51", points: 0, streakDays: 0, status: "pending" },
];

// Weekly points: completed vs in-progress, drives the "exam / learning
// progress" bar chart on the dashboard.
export const weeklyProgress = [
  { week: "Wk 1", completed: 150, inProgress: 85 },
  { week: "Wk 2", completed: 165, inProgress: 110 },
  { week: "Wk 3", completed: 190, inProgress: 90 },
  { week: "Wk 4", completed: 210, inProgress: 60 },
];

// Gamification: daily quests shown on the learner dashboard
export const mockDailyQuests = [
  { id: "dq1", title: "Log in 5 days straight", reward: 5, progress: 5, total: 5, claimed: false },
  { id: "dq2", title: "Finish 3 quizzes without a retry", reward: 15, progress: 1, total: 3, claimed: false },
  { id: "dq3", title: "Complete one video module today", reward: 10, progress: 0, total: 1, claimed: false },
];

export const mockCourses = [
  {
    id: "c1",
    title: "Workplace Data Protection & Privacy",
    category: "Compliance",
    mandatory: true,
    durationMins: 45,
    thumbnailColor: "#dc2626",
    thumbnailImage: "https://picsum.photos/seed/data-privacy-course/480/300",
    studentsCount: 214,
    updatedDate: "2026-03-29",
    price: 0,
    certificate: { title: "Certificate of Completion — Data Protection & Privacy", issuer: "People & Culture" },
    description: "Understand your obligations under company data policy and relevant privacy law.",
    modules: [
      { id: "c1-m1", title: "Why data protection matters", type: "video", durationMins: 12 },
      { id: "c1-m2", title: "Handling customer data", type: "video", durationMins: 15 },
      { id: "c1-m3", title: "Reporting a data incident", type: "reading", durationMins: 8 },
      { id: "c1-m4", title: "Knowledge check", type: "quiz", durationMins: 10 },
    ],
    quiz: {
      passingScore: 80,
      questions: [
        {
          id: "q1",
          prompt: "What should you do first if you suspect a data breach?",
          options: ["Delete the affected records", "Report it to your manager and IT immediately", "Wait to see if it happens again", "Post about it in the team chat"],
          answerIndex: 1,
        },
        {
          id: "q2",
          prompt: "Customer data may be shared externally when:",
          options: ["A colleague asks casually", "There is a documented, approved business reason", "It's needed for a personal favor", "Never, under any circumstance"],
          answerIndex: 1,
        },
      ],
    },
  },
  {
    id: "c2",
    title: "Leading High-Performing Teams",
    category: "Leadership",
    mandatory: false,
    durationMins: 90,
    thumbnailColor: "#2563eb",
    thumbnailImage: "https://picsum.photos/seed/leadership-course/480/300",
    studentsCount: 356,
    updatedDate: "2026-02-14",
    price: 250,
    certificate: { title: "Certificate of Completion — Leading High-Performing Teams", issuer: "Learning & Development" },
    capstone: {
      title: "Team Improvement Plan",
      instructions:
        "Write a 2-3 page improvement plan for a real or hypothetical team you manage: current state, one specific feedback framework you'll apply, and how you'll measure progress over the next quarter.",
    },
    description: "Practical frameworks for first-time and experienced people managers.",
    modules: [
      { id: "c2-m1", title: "Setting clear expectations", type: "video", durationMins: 18 },
      { id: "c2-m2", title: "Giving effective feedback", type: "video", durationMins: 22 },
      { id: "c2-m3", title: "1:1 meeting frameworks", type: "reading", durationMins: 15 },
      { id: "c2-m4", title: "Case study exercise", type: "reading", durationMins: 20 },
      { id: "c2-m5", title: "Knowledge check", type: "quiz", durationMins: 15 },
    ],
    quiz: {
      passingScore: 70,
      questions: [
        {
          id: "q1",
          prompt: "Effective feedback is best delivered:",
          options: ["As soon as possible, tied to a specific example", "Only during annual reviews", "In a group setting for accountability", "Via a generic company-wide email"],
          answerIndex: 0,
        },
      ],
    },
  },
  {
    id: "c3",
    title: "New Hire Onboarding Essentials",
    category: "Onboarding",
    mandatory: true,
    durationMins: 60,
    thumbnailColor: "#16a34a",
    thumbnailImage: "https://picsum.photos/seed/onboarding-course/480/300",
    studentsCount: 502,
    updatedDate: "2026-01-20",
    price: 0,
    certificate: { title: "Certificate of Completion — New Hire Onboarding", issuer: "People & Culture" },
    description: "Everything a new employee needs in their first two weeks.",
    modules: [
      { id: "c3-m1", title: "Company mission & values", type: "video", durationMins: 10 },
      { id: "c3-m2", title: "Tools & systems walkthrough", type: "video", durationMins: 20 },
      { id: "c3-m3", title: "Benefits overview", type: "reading", durationMins: 10 },
      { id: "c3-m4", title: "Knowledge check", type: "quiz", durationMins: 10 },
    ],
    quiz: {
      passingScore: 60,
      questions: [
        {
          id: "q1",
          prompt: "Where do you submit a benefits enrollment request?",
          options: ["The HR portal", "Slack DM to your manager", "A printed form", "You don't need to — it's automatic"],
          answerIndex: 0,
        },
      ],
    },
  },
  {
    id: "c4",
    title: "Workplace Health & Safety Refresher",
    category: "Compliance",
    mandatory: true,
    durationMins: 30,
    thumbnailColor: "#dc2626",
    thumbnailImage: "https://picsum.photos/seed/safety-course/480/300",
    studentsCount: 289,
    updatedDate: "2026-04-02",
    price: 0,
    certificate: { title: "Certificate of Completion — Health & Safety Refresher", issuer: "People & Culture" },
    description: "Annual refresher required for all staff across all office locations.",
    modules: [
      { id: "c4-m1", title: "Fire & emergency procedures", type: "video", durationMins: 10 },
      { id: "c4-m2", title: "Ergonomics at your desk", type: "reading", durationMins: 8 },
      { id: "c4-m3", title: "Knowledge check", type: "quiz", durationMins: 10 },
    ],
    quiz: {
      passingScore: 80,
      questions: [
        {
          id: "q1",
          prompt: "In case of a fire alarm, you should:",
          options: ["Finish your current task first", "Proceed calmly to the nearest marked exit", "Use the elevator to leave faster", "Wait for a second alarm to confirm"],
          answerIndex: 1,
        },
      ],
    },
  },
  {
    id: "c5",
    title: "Excel for Reporting & Dashboards",
    category: "Technical Skills",
    mandatory: false,
    durationMins: 120,
    thumbnailColor: "#9333ea",
    thumbnailImage: "https://picsum.photos/seed/excel-course/480/300",
    studentsCount: 178,
    updatedDate: "2026-05-11",
    price: 180,
    certificate: { title: "Certificate of Completion — Excel for Reporting & Dashboards", issuer: "Learning & Development" },
    description: "Build pivot tables, dashboards, and clean reporting workflows in Excel.",
    modules: [
      { id: "c5-m1", title: "Pivot tables from scratch", type: "video", durationMins: 25 },
      { id: "c5-m2", title: "Formulas for reporting", type: "video", durationMins: 30 },
      { id: "c5-m3", title: "Building a dashboard", type: "video", durationMins: 35 },
      { id: "c5-m4", title: "Knowledge check", type: "quiz", durationMins: 15 },
    ],
    quiz: {
      passingScore: 70,
      questions: [
        {
          id: "q1",
          prompt: "Which feature summarizes large datasets interactively?",
          options: ["Conditional formatting", "Pivot tables", "Cell borders", "Print preview"],
          answerIndex: 1,
        },
      ],
    },
  },
  {
    id: "c6",
    title: "Anti-Harassment & Respectful Workplace",
    category: "Compliance",
    mandatory: true,
    durationMins: 40,
    thumbnailColor: "#dc2626",
    thumbnailImage: "https://picsum.photos/seed/respect-course/480/300",
    studentsCount: 401,
    updatedDate: "2026-03-05",
    price: 0,
    certificate: { title: "Certificate of Completion — Anti-Harassment & Respectful Workplace", issuer: "People & Culture" },
    description: "Mandatory annual training on maintaining a respectful, harassment-free workplace.",
    modules: [
      { id: "c6-m1", title: "Recognizing harassment", type: "video", durationMins: 15 },
      { id: "c6-m2", title: "Reporting channels", type: "reading", durationMins: 10 },
      { id: "c6-m3", title: "Knowledge check", type: "quiz", durationMins: 15 },
    ],
    quiz: {
      passingScore: 80,
      questions: [
        {
          id: "q1",
          prompt: "If you witness harassment but are not the target, you should:",
          options: ["Ignore it, it's not your business", "Report it through the appropriate channel", "Handle it yourself with the offender directly", "Post about it publicly online"],
          answerIndex: 1,
        },
      ],
    },
  },
  {
    id: "c7",
    title: "Effective Client Communication",
    category: "Sales",
    mandatory: false,
    durationMins: 75,
    thumbnailColor: "#0891b2",
    thumbnailImage: "https://picsum.photos/seed/client-comms-course/480/300",
    studentsCount: 233,
    updatedDate: "2026-06-02",
    price: 200,
    certificate: { title: "Certificate of Completion — Effective Client Communication", issuer: "Learning & Development" },
    description: "Sharpen how you communicate with clients across email, calls, and meetings.",
    modules: [
      { id: "c7-m1", title: "Setting the tone in first contact", type: "video", durationMins: 15 },
      { id: "c7-m2", title: "Handling objections", type: "video", durationMins: 20 },
      { id: "c7-m3", title: "Written communication best practices", type: "reading", durationMins: 15 },
      { id: "c7-m4", title: "Knowledge check", type: "quiz", durationMins: 10 },
    ],
    quiz: {
      passingScore: 70,
      questions: [
        {
          id: "q1",
          prompt: "When a client raises an objection, the first step is usually to:",
          options: ["Dismiss it and move on", "Acknowledge it and ask clarifying questions", "Immediately offer a discount", "Escalate to a manager"],
          answerIndex: 1,
        },
      ],
    },
  },
  {
    id: "c8",
    title: "Introduction to Project Management",
    category: "Technical Skills",
    mandatory: false,
    durationMins: 100,
    thumbnailColor: "#db2777",
    thumbnailImage: "https://picsum.photos/seed/pm-course/480/300",
    studentsCount: 312,
    updatedDate: "2026-04-18",
    price: 220,
    certificate: { title: "Certificate of Completion — Introduction to Project Management", issuer: "Learning & Development" },
    capstone: {
      title: "Mini Project Plan",
      instructions:
        "Submit a project charter (PDF or Word doc) for a small project of your choice: scope, timeline, key milestones, and a basic risk register with at least 3 identified risks.",
    },
    description: "Core planning, tracking, and delivery skills for running small projects.",
    modules: [
      { id: "c8-m1", title: "Project lifecycle basics", type: "video", durationMins: 20 },
      { id: "c8-m2", title: "Building a project timeline", type: "video", durationMins: 25 },
      { id: "c8-m3", title: "Risk & stakeholder management", type: "reading", durationMins: 20 },
      { id: "c8-m4", title: "Knowledge check", type: "quiz", durationMins: 15 },
    ],
    quiz: {
      passingScore: 70,
      questions: [
        {
          id: "q1",
          prompt: "A project risk register is used to:",
          options: ["Track team birthdays", "Identify, track, and mitigate potential issues", "Record client invoices", "Schedule vacation days"],
          answerIndex: 1,
        },
      ],
    },
  },
];

// One row per (user, course). progress is 0-100. completedModuleIds tracks
// which modules within that course the learner has finished.
export const mockEnrollments = [
  { id: "e1", userId: "u1", courseId: "c1", status: "completed", progress: 100, completedModuleIds: ["c1-m1", "c1-m2", "c1-m3", "c1-m4"], quizScore: 100, dueDate: "2026-07-15", completedAt: "2026-07-10" },
  { id: "e2", userId: "u1", courseId: "c3", status: "completed", progress: 100, completedModuleIds: ["c3-m1", "c3-m2", "c3-m3", "c3-m4"], quizScore: 100, dueDate: "2026-06-01", completedAt: "2026-05-28" },
  { id: "e3", userId: "u1", courseId: "c2", status: "in-progress", progress: 40, completedModuleIds: ["c2-m1", "c2-m2"], quizScore: null, dueDate: "2026-09-01" },
  { id: "e4", userId: "u1", courseId: "c4", status: "not-started", progress: 0, completedModuleIds: [], quizScore: null, dueDate: "2026-08-20" },
  { id: "e5", userId: "u1", courseId: "c6", status: "not-started", progress: 0, completedModuleIds: [], quizScore: null, dueDate: "2026-08-25" },

  { id: "e6", userId: "u2", courseId: "c1", status: "completed", progress: 100, completedModuleIds: ["c1-m1", "c1-m2", "c1-m3", "c1-m4"], quizScore: 100, dueDate: "2026-07-15", completedAt: "2026-07-14" },
  { id: "e7", userId: "u2", courseId: "c4", status: "in-progress", progress: 66, completedModuleIds: ["c4-m1", "c4-m2"], quizScore: null, dueDate: "2026-08-20" },
  { id: "e8", userId: "u2", courseId: "c6", status: "not-started", progress: 0, completedModuleIds: [], quizScore: null, dueDate: "2026-08-25" },
  { id: "e9", userId: "u2", courseId: "c5", status: "in-progress", progress: 25, completedModuleIds: ["c5-m1"], quizScore: null, dueDate: "2026-10-01" },

  { id: "e10", userId: "u3", courseId: "c1", status: "in-progress", progress: 50, completedModuleIds: ["c1-m1", "c1-m2"], quizScore: null, dueDate: "2026-07-15" },
  { id: "e11", userId: "u3", courseId: "c4", status: "not-started", progress: 0, completedModuleIds: [], quizScore: null, dueDate: "2026-08-20" },
  { id: "e12", userId: "u3", courseId: "c6", status: "completed", progress: 100, completedModuleIds: ["c6-m1", "c6-m2", "c6-m3"], quizScore: 90, dueDate: "2026-08-25", completedAt: "2026-08-01" },

  { id: "e13", userId: "u1", courseId: "c7", status: "in-progress", progress: 25, completedModuleIds: ["c7-m1"], quizScore: null, dueDate: "2026-09-10" },
  { id: "e14", userId: "u1", courseId: "c8", status: "not-started", progress: 0, completedModuleIds: [], quizScore: null, dueDate: "2026-09-20" },
  { id: "e15", userId: "u6", courseId: "c1", status: "completed", progress: 100, completedModuleIds: ["c1-m1", "c1-m2", "c1-m3", "c1-m4"], quizScore: 100, dueDate: "2026-07-15", completedAt: "2026-07-09" },
  { id: "e16", userId: "u6", courseId: "c7", status: "completed", progress: 100, completedModuleIds: ["c7-m1", "c7-m2", "c7-m3", "c7-m4"], quizScore: 90, dueDate: "2026-09-10", completedAt: "2026-08-30" },
  { id: "e17", userId: "u7", courseId: "c1", status: "in-progress", progress: 50, completedModuleIds: ["c1-m1", "c1-m2"], quizScore: null, dueDate: "2026-07-15" },
];

// A "class" is a scheduled cohort: one course, one trainer, a fixed set of
// enrolled learners. Distinct from a plain course enrollment because it
// carries a trainer and a start/end date.
export const mockClasses = [
  {
    id: "cls1",
    title: "Data Protection Cohort — Aug 2026",
    courseId: "c1",
    trainerId: "u8",
    memberIds: ["u1", "u2", "u3"],
    startDate: "2026-08-10",
    endDate: "2026-08-24",
    status: "active",
  },
  {
    id: "cls2",
    title: "Leadership Bootcamp — Q3",
    courseId: "c2",
    trainerId: "u9",
    memberIds: ["u1", "u6"],
    startDate: "2026-09-01",
    endDate: "2026-09-28",
    status: "upcoming",
  },
  {
    id: "cls3",
    title: "Onboarding — August Intake",
    courseId: "c3",
    trainerId: "u8",
    memberIds: ["u7"],
    startDate: "2026-07-01",
    endDate: "2026-07-14",
    status: "completed",
  },
];

// Class-level assignments set by a trainer (or admin) — distinct from a
// course's capstone, which lives on the course itself and applies to
// everyone taking that course regardless of which class/cohort they're in.
export const mockAssignments = [
  {
    id: "asg1",
    classId: "cls1",
    title: "Data handling audit",
    instructions: "Pick one workflow on your team that touches customer data and write up how it should change after this course. Submit as a PDF or Word doc.",
    dueDate: "2026-08-22",
    createdAt: "2026-08-11",
  },
];

export const currentUserId = "u1";
