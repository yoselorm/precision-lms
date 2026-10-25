// ---------------------------------------------------------------------------
// Placeholder data for the LMS demo. Nothing here hits a real API — this is
// what seeds the Redux store so the client can see the full experience
// before any backend exists.
// ---------------------------------------------------------------------------

// Real stock footage bundled in the app (src/assets/videos) stands in for
// course video content, cycled across every video-type module below, so
// modules actually play something instead of the "no video yet" placeholder.
import stockVideoA from "../assets/videos/8523640-hd_1920_1080_25fps.mp4";
import stockVideoB from "../assets/videos/6994620-uhd_3840_2160_30fps.mp4";
import stockVideoC from "../assets/videos/5083554-uhd_4096_2160_25fps.mp4";
const stockVideos = [stockVideoA, stockVideoB, stockVideoC];

// Every seed user gets a real email + password so the login screen can do
// genuine credential checks. Passwords are plain demo strings (no backend to
// hash them against) — good enough to exercise a real login form, not a
// real security boundary.
export const mockUsers = [
  { id: "u1", name: "Ama Boateng", email: "ama.boateng@afenet.org", password: "learner123", role: "learner", department: "Customer Success", avatarColor: "#16a34a", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=47", points: 1280, streakDays: 6, status: "approved" },
  { id: "u2", name: "Kojo Ansah", email: "kojo.ansah@afenet.org", password: "learner123", role: "learner", department: "Sales", avatarColor: "#2563eb", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=12", points: 1560, streakDays: 11, status: "approved" },
  { id: "u3", name: "Efua Owusu", email: "efua.owusu@afenet.org", password: "learner123", role: "learner", department: "Operations", avatarColor: "#9333ea", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=32", points: 940, streakDays: 3, status: "approved" },
  { id: "u5", name: "Yaa Asante", email: "yaa.asante@afenet.org", password: "admin123", role: "admin", department: "People & Culture", avatarColor: "#dc2626", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=45", points: 860, streakDays: 2, status: "approved" },
  { id: "u6", name: "Nana Adjei", email: "nana.adjei@afenet.org", password: "learner123", role: "learner", department: "Sales", avatarColor: "#0891b2", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=14", points: 1720, streakDays: 9, status: "approved" },
  { id: "u7", name: "Abena Darko", email: "abena.darko@afenet.org", password: "learner123", role: "learner", department: "Marketing", avatarColor: "#db2777", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=25", points: 690, streakDays: 1, status: "approved" },
  { id: "u8", name: "Dr. Samuel Osei", email: "samuel.osei@afenet.org", password: "trainer123", role: "trainer", department: "Learning & Development", avatarColor: "#0f766e", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=59", points: 0, streakDays: 0, status: "approved" },
  { id: "u9", name: "Linda Appiah", email: "linda.appiah@afenet.org", password: "trainer123", role: "trainer", department: "Learning & Development", avatarColor: "#7c3aed", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=48", points: 0, streakDays: 0, status: "approved" },
  { id: "u10", name: "Joseph Nkrumah", email: "joseph.nkrumah@afenet.org", password: "trainer123", role: "trainer", department: "Learning & Development", avatarColor: "#ca8a04", managerId: null, avatarUrl: "https://i.pravatar.cc/150?img=51", points: 0, streakDays: 0, status: "pending" },
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-03-29",
    price: 0,
    certificate: {
      title: "Certificate of Completion — Data Protection & Privacy",
      issuer: "People & Culture"
    },
    description: "Understand your obligations under company data policy and relevant privacy law.",
    topics: [
      {
        id: "c1-t1",
        title: "Why data protection matters & more",
        lessons: [
          {
            id: "c1-t1-l1",
            title: "Why data protection matters",
            type: "video",
            durationMins: 12,
            videoUrl: stockVideos[0]
          },
          {
            id: "c1-t1-l2",
            title: "Handling customer data",
            type: "video",
            durationMins: 15,
            videoUrl: stockVideos[1]
          }
        ],
        quiz: {
          passingScore: 80,
          timeLimitMins: 8,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "What should you do first if you suspect a data breach?",
              options: [
                "Delete the affected records",
                "Report it to your manager and IT immediately",
                "Wait to see if it happens again",
                "Post about it in the team chat"
              ],
              correct: [1]
            },
            {
              id: "q2",
              type: "multi",
              prompt: "Which of these are appropriate reasons to share customer data externally? (select all that apply)",
              options: [
                "A colleague asks casually",
                "There is a documented, approved business reason",
                "A regulator makes a lawful request through proper channels",
                "It's needed for a personal favor"
              ],
              correct: [1, 2]
            },
            {
              id: "q3",
              type: "single",
              prompt: "True or false: customer data can be stored on a personal device if it's password protected.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q4",
              type: "single",
              prompt: "Which principle means only collecting the customer data you actually need?",
              options: [
                "Data minimization",
                "Data maximization",
                "Open access",
                "Retention forever"
              ],
              correct: [0]
            },
            {
              id: "q5",
              type: "multi",
              prompt: "Which of these count as personal data under company policy? (select all that apply)",
              options: [
                "A customer's email address",
                "A customer's home address",
                "An anonymized aggregate sales total",
                "A customer's phone number"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q6",
              type: "single",
              prompt: "How long should you keep customer records after they're no longer needed?",
              options: [
                "Forever, just in case",
                "Only as long as the retention policy specifies",
                "Until the hard drive is full",
                "It doesn't matter"
              ],
              correct: [1]
            }
          ]
        }
      },
      {
        id: "c1-t2",
        title: "Reporting a data incident & more",
        lessons: [
          {
            id: "c1-t2-l1",
            title: "Reporting a data incident",
            type: "text",
            durationMins: 8,
            body: ""
          }
        ],
        quiz: {
          passingScore: 80,
          questions: [
            {
              id: "q7",
              type: "single",
              prompt: "A customer asks what data you hold on them. You should:",
              options: [
                "Refuse to answer",
                "Direct them to the proper data access request process",
                "Email them a spreadsheet immediately without verifying identity",
                "Ignore the request"
              ],
              correct: [1]
            },
            {
              id: "q8",
              type: "single",
              prompt: "You accidentally email a customer's file to the wrong recipient. What's the right first move?",
              options: [
                "Do nothing and hope they don't open it",
                "Report it as a data incident right away",
                "Wait a week to see if it matters",
                "Delete your own copy and move on"
              ],
              correct: [1]
            },
            {
              id: "q9",
              type: "multi",
              prompt: "Which of these are good password practices? (select all that apply)",
              options: [
                "Reuse the same password everywhere",
                "Use a unique password per system",
                "Enable multi-factor authentication where available",
                "Share your password with a trusted teammate"
              ],
              correct: [1, 2]
            },
            {
              id: "q10",
              type: "single",
              prompt: "True or false: encrypting a laptop's hard drive helps protect customer data if the device is lost or stolen.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q11",
              type: "single",
              prompt: "What is a Data Protection Impact Assessment generally used for?",
              options: [
                "Deciding what to serve at the office party",
                "Evaluating privacy risk before starting a new activity that processes personal data",
                "Tracking employee vacation days",
                "Setting sales targets"
              ],
              correct: [1]
            },
            {
              id: "q12",
              type: "single",
              prompt: "Before disposing of an old laptop that held customer data, you should:",
              options: [
                "Just throw it in the regular trash",
                "Ensure the data is securely wiped per IT's disposal process",
                "Give it to a friend as-is",
                "Nothing — it's fine once it's off"
              ],
              correct: [1]
            }
          ]
        }
      }
    ]
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-02-14",
    price: 250,
    certificate: {
      title: "Certificate of Completion — Leading High-Performing Teams",
      issuer: "Learning & Development"
    },
    description: "Practical frameworks for first-time and experienced people managers.",
    topics: [
      {
        id: "c2-t1",
        title: "Setting clear expectations & more",
        lessons: [
          {
            id: "c2-t1-l1",
            title: "Setting clear expectations",
            type: "video",
            durationMins: 18,
            videoUrl: stockVideos[2]
          },
          {
            id: "c2-t1-l2",
            title: "Giving effective feedback",
            type: "video",
            durationMins: 22,
            videoUrl: stockVideos[0]
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "Effective feedback is best delivered:",
              options: [
                "As soon as possible, tied to a specific example",
                "Only during annual reviews",
                "In a group setting for accountability",
                "Via a generic company-wide email"
              ],
              correct: [0]
            },
            {
              id: "q2",
              type: "multi",
              prompt: "Which of these belong in a good 1:1 meeting? (select all that apply)",
              options: [
                "The manager's agenda only",
                "Space for the report's priorities and blockers",
                "Career development check-ins",
                "Public performance rankings"
              ],
              correct: [1, 2]
            },
            {
              id: "q3",
              type: "single",
              prompt: "True or false: setting clear expectations upfront reduces the need for corrective feedback later.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q4",
              type: "single",
              prompt: "A team member consistently misses deadlines. The best first step is:",
              options: [
                "Publicly call it out in a team meeting",
                "Have a private conversation to understand the cause",
                "Reassign all their work immediately",
                "Ignore it and hope it improves"
              ],
              correct: [1]
            },
            {
              id: "q5",
              type: "single",
              prompt: "Which of these best describes psychological safety on a team?",
              options: [
                "Everyone agrees with the manager at all times",
                "People feel safe to speak up, disagree, and make mistakes without fear of punishment",
                "No one ever gives critical feedback",
                "Only senior staff can raise concerns"
              ],
              correct: [1]
            },
            {
              id: "q6",
              type: "multi",
              prompt: "Which of these are signs of a high-performing team? (select all that apply)",
              options: [
                "Clear shared goals",
                "Constant unresolved conflict",
                "Mutual trust and accountability",
                "Regular, honest feedback"
              ],
              correct: [0, 2, 3]
            }
          ]
        }
      },
      {
        id: "c2-t2",
        title: "1:1 meeting frameworks & more",
        lessons: [
          {
            id: "c2-t2-l1",
            title: "1:1 meeting frameworks",
            type: "text",
            durationMins: 15,
            body: ""
          },
          {
            id: "c2-t2-l2",
            title: "Case study exercise",
            type: "text",
            durationMins: 20,
            body: ""
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q7",
              type: "single",
              prompt: "SMART goals are best described as:",
              options: [
                "Specific, Measurable, Achievable, Relevant, Time-bound",
                "Simple, Manual, Approved, Rigid, Timeless",
                "Strategic, Marketable, Ambitious, Random, Team-based",
                "A framework for expense reports"
              ],
              correct: [0]
            },
            {
              id: "q8",
              type: "single",
              prompt: "True or false: a manager should only ever delegate low-value, tedious tasks.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q9",
              type: "single",
              prompt: "What's a healthy way to handle disagreement in a team meeting?",
              options: [
                "Shut it down immediately to keep things calm",
                "Let people voice differing views respectfully and work toward a decision",
                "Only the manager's opinion matters",
                "Move the disagreement to private side conversations forever"
              ],
              correct: [1]
            },
            {
              id: "q10",
              type: "multi",
              prompt: "Which of these support accountability on a team? (select all that apply)",
              options: [
                "Clear ownership of tasks",
                "Vague, unassigned responsibilities",
                "Regular check-ins on progress",
                "Consequences that are consistent and fair"
              ],
              correct: [0, 2, 3]
            },
            {
              id: "q11",
              type: "single",
              prompt: "When coaching an underperforming team member, the best approach usually starts with:",
              options: [
                "Assuming they don't care and giving up on them",
                "Understanding the root cause together before jumping to solutions",
                "Immediately putting them on a performance improvement plan",
                "Publicly comparing them to a top performer"
              ],
              correct: [1]
            },
            {
              id: "q12",
              type: "single",
              prompt: "True or false: recognizing good work in front of the team can reinforce the behaviors you want to see more of.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            }
          ]
        }
      }
    ]
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-01-20",
    price: 0,
    certificate: {
      title: "Certificate of Completion — New Hire Onboarding",
      issuer: "People & Culture"
    },
    description: "Everything a new employee needs in their first two weeks.",
    topics: [
      {
        id: "c3-t1",
        title: "Company mission & values & more",
        lessons: [
          {
            id: "c3-t1-l1",
            title: "Company mission & values",
            type: "video",
            durationMins: 10,
            videoUrl: stockVideos[1]
          },
          {
            id: "c3-t1-l2",
            title: "Tools & systems walkthrough",
            type: "video",
            durationMins: 20,
            videoUrl: stockVideos[2]
          }
        ],
        quiz: {
          passingScore: 60,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "Where do you submit a benefits enrollment request?",
              options: [
                "The HR portal",
                "Slack DM to your manager",
                "A printed form",
                "You don't need to — it's automatic"
              ],
              correct: [0]
            },
            {
              id: "q2",
              type: "multi",
              prompt: "Which of these should be part of your first two weeks? (select all that apply)",
              options: [
                "Meeting your manager",
                "Setting up your accounts and tools",
                "Reviewing the company mission and values",
                "Skipping onboarding entirely"
              ],
              correct: [0, 1, 2]
            },
            {
              id: "q3",
              type: "single",
              prompt: "True or false: you should wait until your 90-day review to ask questions about your role.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q4",
              type: "single",
              prompt: "Who is generally your first point of contact for day-to-day questions?",
              options: [
                "The CEO",
                "Your manager or onboarding buddy",
                "A random colleague",
                "No one — figure it out yourself"
              ],
              correct: [1]
            },
            {
              id: "q5",
              type: "single",
              prompt: "Which system did the onboarding walkthrough cover for day-to-day tools?",
              options: [
                "A random personal app",
                "The company's internal tools & systems walkthrough",
                "Nothing — tools aren't covered",
                "A competitor's software"
              ],
              correct: [1]
            },
            {
              id: "q6",
              type: "single",
              prompt: "Where can you find the company's mission and values?",
              options: [
                "Nowhere, it's a secret",
                "Covered in the onboarding module and company handbook",
                "Only the CEO knows them",
                "You have to guess"
              ],
              correct: [1]
            }
          ]
        }
      },
      {
        id: "c3-t2",
        title: "Benefits overview & more",
        lessons: [
          {
            id: "c3-t2-l1",
            title: "Benefits overview",
            type: "text",
            durationMins: 10,
            body: ""
          }
        ],
        quiz: {
          passingScore: 60,
          questions: [
            {
              id: "q7",
              type: "multi",
              prompt: "Which of these are typically part of a new hire's benefits overview? (select all that apply)",
              options: [
                "Health coverage options",
                "Retirement/pension plan details",
                "The office coffee brand",
                "Time-off policy"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q8",
              type: "single",
              prompt: "True or false: it's a good idea to introduce yourself to your immediate team in your first week.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q9",
              type: "single",
              prompt: "If you're unsure which tool to use for a task in your first week, you should:",
              options: [
                "Guess and hope for the best",
                "Ask your manager or onboarding buddy",
                "Wait months until someone tells you",
                "Avoid the task entirely"
              ],
              correct: [1]
            },
            {
              id: "q10",
              type: "single",
              prompt: "What's a reasonable expectation for your first two weeks on the job?",
              options: [
                "You'll master everything immediately",
                "You'll be learning tools, meeting people, and getting oriented",
                "You won't need any training at all",
                "You should already know all company processes"
              ],
              correct: [1]
            },
            {
              id: "q11",
              type: "single",
              prompt: "True or false: asking questions during onboarding is a sign you're not ready for the role.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q12",
              type: "single",
              prompt: "Who typically approves your benefits enrollment selections?",
              options: [
                "It's automatic once submitted through the HR portal",
                "Your direct manager types it in manually for you",
                "A random coworker",
                "No approval is ever needed"
              ],
              correct: [0]
            }
          ]
        }
      }
    ]
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-04-02",
    price: 0,
    certificate: {
      title: "Certificate of Completion — Health & Safety Refresher",
      issuer: "People & Culture"
    },
    description: "Annual refresher required for all staff across all office locations.",
    topics: [
      {
        id: "c4-t1",
        title: "Course content",
        lessons: [
          {
            id: "c4-t1-l1",
            title: "Fire & emergency procedures",
            type: "video",
            durationMins: 10,
            videoUrl: stockVideos[0]
          },
          {
            id: "c4-t1-l2",
            title: "Ergonomics at your desk",
            type: "text",
            durationMins: 8,
            body: ""
          }
        ],
        quiz: {
          passingScore: 80,
          timeLimitMins: 6,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "In case of a fire alarm, you should:",
              options: [
                "Finish your current task first",
                "Proceed calmly to the nearest marked exit",
                "Use the elevator to leave faster",
                "Wait for a second alarm to confirm"
              ],
              correct: [1]
            },
            {
              id: "q2",
              type: "single",
              prompt: "True or false: it's fine to use the elevator during a fire alarm if you're in a hurry.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q3",
              type: "multi",
              prompt: "Which of these help prevent desk-related strain injuries? (select all that apply)",
              options: [
                "Monitor at eye level",
                "Feet flat on the floor or a footrest",
                "Wrists bent sharply upward while typing",
                "Regular short breaks to stand and stretch"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q4",
              type: "single",
              prompt: "Where should you report a workplace safety hazard?",
              options: [
                "Ignore it, someone else will notice",
                "Through the designated safety reporting channel",
                "Post about it on social media",
                "Fix it yourself with no training"
              ],
              correct: [1]
            },
            {
              id: "q5",
              type: "single",
              prompt: "How often is this health & safety refresher required?",
              options: [
                "Once, ever",
                "Annually for all staff",
                "Only for new hires",
                "Only for facilities staff"
              ],
              correct: [1]
            },
            {
              id: "q6",
              type: "single",
              prompt: "True or false: you should know at least two evacuation routes from your work area.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q7",
              type: "single",
              prompt: "Where is the designated meeting point after evacuating for a fire alarm?",
              options: [
                "Wherever feels convenient",
                "The assembly point specified in your building's safety plan",
                "Back inside once the noise stops",
                "The parking garage stairwell"
              ],
              correct: [1]
            },
            {
              id: "q8",
              type: "multi",
              prompt: "Which of these should you do if you spot a spill or trip hazard? (select all that apply)",
              options: [
                "Warn nearby colleagues",
                "Report it through the safety channel",
                "Step over it and say nothing",
                "Cordon it off or mark it if you safely can"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q9",
              type: "single",
              prompt: "True or false: minor near-miss incidents (no injury, but almost) don't need to be reported.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q10",
              type: "single",
              prompt: "What's the first thing you should do if a colleague is injured at work?",
              options: [
                "Move them immediately regardless of the injury",
                "Assess the situation, get help/first aid, and follow the incident reporting process",
                "Take a photo for social media first",
                "Ignore it and keep working"
              ],
              correct: [1]
            },
            {
              id: "q11",
              type: "single",
              prompt: "Ergonomically, your monitor should generally be positioned:",
              options: [
                "Far below eye level",
                "At roughly eye level, about an arm's length away",
                "Directly in sunlight glare",
                "On the floor"
              ],
              correct: [1]
            },
            {
              id: "q12",
              type: "single",
              prompt: "True or false: fire extinguishers should only be used by trained staff unless there's no other option and it's safe to do so.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            }
          ]
        }
      }
    ]
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-05-11",
    price: 180,
    certificate: {
      title: "Certificate of Completion — Excel for Reporting & Dashboards",
      issuer: "Learning & Development"
    },
    description: "Build pivot tables, dashboards, and clean reporting workflows in Excel.",
    topics: [
      {
        id: "c5-t1",
        title: "Pivot tables from scratch & more",
        lessons: [
          {
            id: "c5-t1-l1",
            title: "Pivot tables from scratch",
            type: "video",
            durationMins: 25,
            videoUrl: stockVideos[1]
          },
          {
            id: "c5-t1-l2",
            title: "Formulas for reporting",
            type: "video",
            durationMins: 30,
            videoUrl: stockVideos[2]
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "Which feature summarizes large datasets interactively?",
              options: [
                "Conditional formatting",
                "Pivot tables",
                "Cell borders",
                "Print preview"
              ],
              correct: [1]
            },
            {
              id: "q2",
              type: "single",
              prompt: "Which function looks up a value in a table and returns a related value?",
              options: [
                "SUM",
                "VLOOKUP / XLOOKUP",
                "COUNT",
                "TODAY"
              ],
              correct: [1]
            },
            {
              id: "q3",
              type: "multi",
              prompt: "Which of these are good practices when building a dashboard? (select all that apply)",
              options: [
                "Keep a consistent color scheme",
                "Cram every metric onto one screen with no labels",
                "Use clear chart titles and axis labels",
                "Highlight the metrics that matter most"
              ],
              correct: [0, 2, 3]
            },
            {
              id: "q4",
              type: "single",
              prompt: "True or false: a pivot table updates automatically the instant your source data changes, with no refresh needed.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q5",
              type: "single",
              prompt: "What does the $ symbol do in a cell reference like $A$1?",
              options: [
                "Formats the cell as currency",
                "Locks the row and column so it doesn't shift when copied",
                "Deletes the cell contents",
                "Nothing, it's ignored"
              ],
              correct: [1]
            },
            {
              id: "q6",
              type: "single",
              prompt: "Which chart type is generally best for showing a trend over time?",
              options: [
                "Pie chart",
                "Line chart",
                "Scatter with no axes",
                "3D exploded pie"
              ],
              correct: [1]
            }
          ]
        }
      },
      {
        id: "c5-t2",
        title: "Building a dashboard & more",
        lessons: [
          {
            id: "c5-t2-l1",
            title: "Building a dashboard",
            type: "video",
            durationMins: 35,
            videoUrl: stockVideos[0]
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q7",
              type: "single",
              prompt: "Which function would you use to count how many cells in a range meet a condition?",
              options: [
                "COUNTIF",
                "SUM",
                "AVERAGE",
                "TRIM"
              ],
              correct: [0]
            },
            {
              id: "q8",
              type: "multi",
              prompt: "Which of these are valid ways to summarize data in Excel? (select all that apply)",
              options: [
                "Pivot tables",
                "SUM/AVERAGE formulas",
                "Randomly deleting rows",
                "Conditional formatting to highlight outliers"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q9",
              type: "single",
              prompt: "True or false: a well-labeled dashboard should still let a viewer understand it without you explaining it live.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q10",
              type: "single",
              prompt: "Freezing panes in Excel is most useful for:",
              options: [
                "Deleting old data permanently",
                "Keeping header rows/columns visible while you scroll",
                "Changing the font color",
                "Merging cells automatically"
              ],
              correct: [1]
            },
            {
              id: "q11",
              type: "single",
              prompt: "Which of these is a common cause of a broken formula after copying it across cells?",
              options: [
                "Using absolute vs. relative references incorrectly",
                "The formula bar being too narrow",
                "Using too many colors",
                "Nothing, formulas never break"
              ],
              correct: [0]
            },
            {
              id: "q12",
              type: "single",
              prompt: "A slicer in a pivot table dashboard is used to:",
              options: [
                "Delete unwanted rows permanently",
                "Let viewers interactively filter what the dashboard shows",
                "Change the workbook's file format",
                "Print the report"
              ],
              correct: [1]
            }
          ]
        }
      }
    ]
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-03-05",
    price: 0,
    certificate: {
      title: "Certificate of Completion — Anti-Harassment & Respectful Workplace",
      issuer: "People & Culture"
    },
    description: "Mandatory annual training on maintaining a respectful, harassment-free workplace.",
    topics: [
      {
        id: "c6-t1",
        title: "Course content",
        lessons: [
          {
            id: "c6-t1-l1",
            title: "Recognizing harassment",
            type: "video",
            durationMins: 15,
            videoUrl: stockVideos[1]
          },
          {
            id: "c6-t1-l2",
            title: "Reporting channels",
            type: "text",
            durationMins: 10,
            body: ""
          }
        ],
        quiz: {
          passingScore: 80,
          timeLimitMins: 7,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "If you witness harassment but are not the target, you should:",
              options: [
                "Ignore it, it's not your business",
                "Report it through the appropriate channel",
                "Handle it yourself with the offender directly",
                "Post about it publicly online"
              ],
              correct: [1]
            },
            {
              id: "q2",
              type: "multi",
              prompt: "Which of these can count as workplace harassment? (select all that apply)",
              options: [
                "Repeated unwanted comments about someone's appearance",
                "A single respectful piece of constructive feedback",
                "Persistent unwelcome messages after being asked to stop",
                "Excluding someone from work communications because of their identity"
              ],
              correct: [0, 2, 3]
            },
            {
              id: "q3",
              type: "single",
              prompt: "True or false: retaliating against someone for reporting harassment in good faith is itself a policy violation.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q4",
              type: "single",
              prompt: "How often is anti-harassment training required under company policy?",
              options: [
                "Once, at hiring only",
                "Annually for all staff",
                "Never — it's optional",
                "Only for managers"
              ],
              correct: [1]
            },
            {
              id: "q5",
              type: "single",
              prompt: "A colleague confides in you that they're being harassed but asks you to keep it fully secret and do nothing. The best response is:",
              options: [
                "Promise total secrecy and do nothing",
                "Encourage and help them report it through the proper channel, explaining you may be obligated to escalate",
                "Confront the alleged harasser yourself",
                "Tell the whole team"
              ],
              correct: [1]
            },
            {
              id: "q6",
              type: "single",
              prompt: "Reports of harassment should be handled:",
              options: [
                "Publicly, so everyone knows",
                "Confidentially, through the designated reporting process",
                "Only if the target is willing to name the person publicly first",
                "By a general team vote"
              ],
              correct: [1]
            },
            {
              id: "q7",
              type: "multi",
              prompt: "Which of these are appropriate outcomes of a harassment investigation? (select all that apply)",
              options: [
                "Corrective action for the offender if substantiated",
                "Support offered to the person who reported it",
                "Automatic punishment of the person who reported it",
                "A documented, confidential record of the process"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q8",
              type: "single",
              prompt: "True or false: jokes about a coworker's protected characteristic (like ethnicity or gender) are fine as long as you're \"just kidding.\"",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q9",
              type: "single",
              prompt: "A respectful workplace culture is primarily built by:",
              options: [
                "Policy documents alone",
                "Everyone's everyday behavior, backed by clear policy and consistent enforcement",
                "HR handling everything without input from staff",
                "Ignoring small issues so they don't escalate"
              ],
              correct: [1]
            },
            {
              id: "q10",
              type: "single",
              prompt: "If you're unsure whether something counts as harassment, a good next step is:",
              options: [
                "Assume it's fine and drop it",
                "Ask HR or check the reporting policy for guidance",
                "Post about it online to get opinions",
                "Handle it with a group vote"
              ],
              correct: [1]
            },
            {
              id: "q11",
              type: "single",
              prompt: "True or false: this training applies equally to in-person, remote, and hybrid interactions.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q12",
              type: "single",
              prompt: "Which of these best describes retaliation in this context?",
              options: [
                "Any negative action taken against someone for reporting in good faith",
                "A normal, unrelated performance review",
                "Providing feedback unrelated to the report",
                "Promoting the reporter"
              ],
              correct: [0]
            }
          ]
        }
      }
    ]
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-06-02",
    price: 200,
    certificate: {
      title: "Certificate of Completion — Effective Client Communication",
      issuer: "Learning & Development"
    },
    description: "Sharpen how you communicate with clients across email, calls, and meetings.",
    topics: [
      {
        id: "c7-t1",
        title: "Setting the tone in first contact & more",
        lessons: [
          {
            id: "c7-t1-l1",
            title: "Setting the tone in first contact",
            type: "video",
            durationMins: 15,
            videoUrl: stockVideos[2]
          },
          {
            id: "c7-t1-l2",
            title: "Handling objections",
            type: "video",
            durationMins: 20,
            videoUrl: stockVideos[0]
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "When a client raises an objection, the first step is usually to:",
              options: [
                "Dismiss it and move on",
                "Acknowledge it and ask clarifying questions",
                "Immediately offer a discount",
                "Escalate to a manager"
              ],
              correct: [1]
            },
            {
              id: "q2",
              type: "single",
              prompt: "What's the best tone to set in a first email to a new client?",
              options: [
                "Overly casual and full of slang",
                "Professional, warm, and clear about next steps",
                "Cold and purely transactional",
                "Vague, with no clear ask"
              ],
              correct: [1]
            },
            {
              id: "q3",
              type: "multi",
              prompt: "Which of these are written communication best practices? (select all that apply)",
              options: [
                "Proofread before sending",
                "Use a clear subject line",
                "Bury the main ask in paragraph four",
                "State the purpose of the email early"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q4",
              type: "single",
              prompt: "True or false: it's fine to promise a delivery date you're not sure you can hit, just to keep the client happy in the moment.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q5",
              type: "single",
              prompt: "A client is upset about a missed deadline. The best first move is:",
              options: [
                "Blame another department",
                "Acknowledge the miss, apologize, and give a clear plan forward",
                "Go silent until they calm down",
                "Offer no explanation at all"
              ],
              correct: [1]
            },
            {
              id: "q6",
              type: "single",
              prompt: "On a call, active listening includes:",
              options: [
                "Interrupting to make your point faster",
                "Summarizing back what the client said to confirm understanding",
                "Multitasking on email while they talk",
                "Only speaking, never listening"
              ],
              correct: [1]
            }
          ]
        }
      },
      {
        id: "c7-t2",
        title: "Written communication best practices & more",
        lessons: [
          {
            id: "c7-t2-l1",
            title: "Written communication best practices",
            type: "text",
            durationMins: 15,
            body: ""
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q7",
              type: "multi",
              prompt: "Which of these help de-escalate a frustrated client? (select all that apply)",
              options: [
                "Staying calm and professional",
                "Matching their frustration with your own",
                "Acknowledging their frustration genuinely",
                "Offering a clear next step"
              ],
              correct: [0, 2, 3]
            },
            {
              id: "q8",
              type: "single",
              prompt: "True or false: it's better to over-communicate progress on a project than to go quiet and surprise the client later.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q9",
              type: "single",
              prompt: "When you don't know the answer to a client's question, the best move is:",
              options: [
                "Make something up so you sound confident",
                "Tell them you'll find out and follow up with a timeframe",
                "Ignore the question",
                "Redirect to an unrelated topic"
              ],
              correct: [1]
            },
            {
              id: "q10",
              type: "single",
              prompt: "A good subject line for a client email should:",
              options: [
                "Be blank",
                "Clearly summarize the purpose of the email",
                "Be as vague as possible",
                "Always say 'Urgent!!!' regardless of content"
              ],
              correct: [1]
            },
            {
              id: "q11",
              type: "single",
              prompt: "True or false: tone can be misread in written communication, so it's worth rereading before sending.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q12",
              type: "single",
              prompt: "Which of these best builds long-term client trust?",
              options: [
                "Overpromising to close the deal",
                "Consistently following through on what you commit to",
                "Avoiding difficult conversations",
                "Only communicating when something goes wrong"
              ],
              correct: [1]
            }
          ]
        }
      }
    ]
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
    status: "approved",
    createdBy: null,
    updatedDate: "2026-04-18",
    price: 220,
    certificate: {
      title: "Certificate of Completion — Introduction to Project Management",
      issuer: "Learning & Development"
    },
    description: "Core planning, tracking, and delivery skills for running small projects.",
    topics: [
      {
        id: "c8-t1",
        title: "Project lifecycle basics & more",
        lessons: [
          {
            id: "c8-t1-l1",
            title: "Project lifecycle basics",
            type: "video",
            durationMins: 20,
            videoUrl: stockVideos[1]
          },
          {
            id: "c8-t1-l2",
            title: "Building a project timeline",
            type: "video",
            durationMins: 25,
            videoUrl: stockVideos[2]
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q1",
              type: "single",
              prompt: "A project risk register is used to:",
              options: [
                "Track team birthdays",
                "Identify, track, and mitigate potential issues",
                "Record client invoices",
                "Schedule vacation days"
              ],
              correct: [1]
            },
            {
              id: "q2",
              type: "single",
              prompt: "Which of these best describes a project milestone?",
              options: [
                "A recurring weekly task",
                "A significant checkpoint marking progress toward completion",
                "The project's total budget",
                "A stakeholder's job title"
              ],
              correct: [1]
            },
            {
              id: "q3",
              type: "multi",
              prompt: "Which of these belong in a project charter? (select all that apply)",
              options: [
                "Scope",
                "Key milestones",
                "Unrelated personal notes",
                "Identified risks"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q4",
              type: "single",
              prompt: "True or false: stakeholder management only matters at the very end of a project.",
              options: [
                "True",
                "False"
              ],
              correct: [1]
            },
            {
              id: "q5",
              type: "single",
              prompt: "What's the main purpose of a project timeline?",
              options: [
                "To decorate the project charter",
                "To sequence tasks and show when work happens",
                "To replace the risk register",
                "To track invoices only"
              ],
              correct: [1]
            },
            {
              id: "q6",
              type: "single",
              prompt: "A key risk on your project just became very likely and high-impact. You should:",
              options: [
                "Ignore it until it happens",
                "Update the risk register and communicate a mitigation plan to stakeholders",
                "Cancel the project immediately",
                "Keep it to yourself"
              ],
              correct: [1]
            }
          ]
        }
      },
      {
        id: "c8-t2",
        title: "Risk & stakeholder management & more",
        lessons: [
          {
            id: "c8-t2-l1",
            title: "Risk & stakeholder management",
            type: "text",
            durationMins: 20,
            body: ""
          }
        ],
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: "q7",
              type: "single",
              prompt: "Which of these is a classic sign of scope creep?",
              options: [
                "The project finishing early",
                "New requirements being added without adjusting timeline or budget",
                "A well-documented change request process",
                "Fewer stakeholders than planned"
              ],
              correct: [1]
            },
            {
              id: "q8",
              type: "multi",
              prompt: "Which of these are typical project stakeholders? (select all that apply)",
              options: [
                "The sponsor funding the project",
                "End users of the deliverable",
                "A completely unrelated department with no involvement",
                "The project team"
              ],
              correct: [0, 1, 3]
            },
            {
              id: "q9",
              type: "single",
              prompt: "True or false: a kickoff meeting is a good place to align on scope, roles, and timeline.",
              options: [
                "True",
                "False"
              ],
              correct: [0]
            },
            {
              id: "q10",
              type: "single",
              prompt: "What's the purpose of tracking a project's critical path?",
              options: [
                "To find the sequence of tasks that determines the shortest possible completion time",
                "To assign parking spots",
                "To track office supply orders",
                "It has no practical use"
              ],
              correct: [0]
            },
            {
              id: "q11",
              type: "single",
              prompt: "When a task is going to be late, the best practice is to:",
              options: [
                "Say nothing and hope it resolves itself",
                "Flag it early and discuss options with the team/stakeholders",
                "Wait until the deadline passes to mention it",
                "Quietly extend the deadline yourself with no communication"
              ],
              correct: [1]
            },
            {
              id: "q12",
              type: "single",
              prompt: "A project's \"definition of done\" is best described as:",
              options: [
                "A vague feeling that things are finished",
                "Clear, agreed-upon criteria for when a deliverable is considered complete",
                "Whatever the last person to touch it decides",
                "Not needed if the team is experienced"
              ],
              correct: [1]
            }
          ]
        }
      }
    ]
  }
];

// One row per (user, course). progress is 0-100. completedModuleIds tracks
// which modules within that course the learner has finished.
export const mockEnrollments = [
  { id: "e1", userId: "u1", courseId: "c1", status: "completed", progress: 100, dueDate: "2026-07-15", completedAt: "2026-07-10", completedModuleIds: ["c1-t1-l1", "c1-t1-l2", "c1-t2-l1", "c1-t1__quiz", "c1-t2__quiz"], topicQuizzes: {
    "c1-t1": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-07-10T00:00:00.000Z" }
      ]
    },
    "c1-t2": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-07-10T00:00:00.000Z" }
      ]
    }
  } },
  { id: "e2", userId: "u1", courseId: "c3", status: "completed", progress: 100, dueDate: "2026-06-01", completedAt: "2026-05-28", completedModuleIds: ["c3-t1-l1", "c3-t1-l2", "c3-t2-l1", "c3-t1__quiz", "c3-t2__quiz"], topicQuizzes: {
    "c3-t1": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-05-28T00:00:00.000Z" }
      ]
    },
    "c3-t2": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-05-28T00:00:00.000Z" }
      ]
    }
  } },
  { id: "e3", userId: "u1", courseId: "c2", status: "in-progress", progress: 33, dueDate: "2026-09-01", completedModuleIds: ["c2-t1-l1", "c2-t1-l2"], topicQuizzes: {} },
  { id: "e4", userId: "u1", courseId: "c4", status: "not-started", progress: 0, dueDate: "2026-08-20", completedModuleIds: [], topicQuizzes: {} },
  { id: "e5", userId: "u1", courseId: "c6", status: "not-started", progress: 0, dueDate: "2026-08-25", completedModuleIds: [], topicQuizzes: {} },
  { id: "e6", userId: "u2", courseId: "c1", status: "completed", progress: 100, dueDate: "2026-07-15", completedAt: "2026-07-14", completedModuleIds: ["c1-t1-l1", "c1-t1-l2", "c1-t2-l1", "c1-t1__quiz", "c1-t2__quiz"], topicQuizzes: {
    "c1-t1": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-07-14T00:00:00.000Z" }
      ]
    },
    "c1-t2": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-07-14T00:00:00.000Z" }
      ]
    }
  } },
  { id: "e7", userId: "u2", courseId: "c4", status: "in-progress", progress: 67, dueDate: "2026-08-20", completedModuleIds: ["c4-t1-l1", "c4-t1-l2"], topicQuizzes: {} },
  { id: "e8", userId: "u2", courseId: "c6", status: "not-started", progress: 0, dueDate: "2026-08-25", completedModuleIds: [], topicQuizzes: {} },
  { id: "e9", userId: "u2", courseId: "c5", status: "in-progress", progress: 20, dueDate: "2026-10-01", completedModuleIds: ["c5-t1-l1"], topicQuizzes: {} },
  { id: "e10", userId: "u3", courseId: "c1", status: "in-progress", progress: 40, dueDate: "2026-07-15", completedModuleIds: ["c1-t1-l1", "c1-t1-l2"], topicQuizzes: {} },
  { id: "e11", userId: "u3", courseId: "c4", status: "not-started", progress: 0, dueDate: "2026-08-20", completedModuleIds: [], topicQuizzes: {} },
  { id: "e12", userId: "u3", courseId: "c6", status: "completed", progress: 100, dueDate: "2026-08-25", completedAt: "2026-08-01", completedModuleIds: ["c6-t1-l1", "c6-t1-l2", "c6-t1__quiz"], topicQuizzes: {
    "c6-t1": {
      score: 90,
      attempts: [
        { score: 90, passed: true, submittedAt: "2026-08-01T00:00:00.000Z" }
      ]
    }
  } },
  { id: "e13", userId: "u1", courseId: "c7", status: "in-progress", progress: 20, dueDate: "2026-09-10", completedModuleIds: ["c7-t1-l1"], topicQuizzes: {} },
  { id: "e14", userId: "u1", courseId: "c8", status: "not-started", progress: 0, dueDate: "2026-09-20", completedModuleIds: [], topicQuizzes: {} },
  { id: "e15", userId: "u6", courseId: "c1", status: "completed", progress: 100, dueDate: "2026-07-15", completedAt: "2026-07-09", completedModuleIds: ["c1-t1-l1", "c1-t1-l2", "c1-t2-l1", "c1-t1__quiz", "c1-t2__quiz"], topicQuizzes: {
    "c1-t1": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-07-09T00:00:00.000Z" }
      ]
    },
    "c1-t2": {
      score: 100,
      attempts: [
        { score: 100, passed: true, submittedAt: "2026-07-09T00:00:00.000Z" }
      ]
    }
  } },
  { id: "e16", userId: "u6", courseId: "c7", status: "completed", progress: 100, dueDate: "2026-09-10", completedAt: "2026-08-30", completedModuleIds: ["c7-t1-l1", "c7-t1-l2", "c7-t2-l1", "c7-t1__quiz", "c7-t2__quiz"], topicQuizzes: {
    "c7-t1": {
      score: 90,
      attempts: [
        { score: 90, passed: true, submittedAt: "2026-08-30T00:00:00.000Z" }
      ]
    },
    "c7-t2": {
      score: 90,
      attempts: [
        { score: 90, passed: true, submittedAt: "2026-08-30T00:00:00.000Z" }
      ]
    }
  } },
  { id: "e17", userId: "u7", courseId: "c1", status: "in-progress", progress: 40, dueDate: "2026-07-15", completedModuleIds: ["c1-t1-l1", "c1-t1-l2"], topicQuizzes: {} }
];

// A "class" is a scheduled cohort: one or more courses, one trainer, and a
// roster learners join themselves (memberIds grows via self-enrollment, not
// an admin picking names). Each attached course carries its own `mandatory`
// flag scoped to this class — independent of the course's own global one.
// Distinct from a plain course enrollment because it carries a trainer and a
// start/end date.
export const mockClasses = [
  {
    id: "cls1",
    title: "Data Protection Cohort — Aug 2026",
    courses: [
      { courseId: "c1", mandatory: true },
      { courseId: "c4", mandatory: false },
    ],
    trainerId: "u8",
    memberIds: ["u1", "u2", "u3"],
    startDate: "2026-08-10",
    endDate: "2026-08-24",
    status: "active",
    // A cohort-specific check the trainer set for this class, distinct from
    // the shared course quiz — covers what was actually discussed live.
    quiz: {
      passingScore: 70,
      timeLimitMins: 5,
      questions: [
        {
          id: "cq1",
          type: "single",
          prompt: "In our live session, who did we say is the point of contact for a suspected data incident in this cohort's team?",
          options: ["Whoever is closest", "Your manager and IT, per the reporting process we walked through", "The customer directly", "No one — just monitor it"],
          correct: [1],
        },
        {
          id: "cq2",
          type: "multi",
          prompt: "From the group exercise, which workflows did your table identify as touching customer data? (select all that apply)",
          options: ["Customer support tickets", "Payroll for internal staff only", "Sales CRM records", "Marketing email lists"],
          correct: [0, 2, 3],
        },
        {
          id: "cq3",
          type: "single",
          prompt: "True or false: the audit assignment for this cohort asks you to review a real workflow your team uses.",
          options: ["True", "False"],
          correct: [0],
        },
        {
          id: "cq4",
          type: "single",
          prompt: "What did the trainer recommend as the first step before making changes to a data workflow?",
          options: ["Just change it and see what happens", "Document the current process and the proposed change", "Ask nobody", "Wait a year"],
          correct: [1],
        },
      ],
    },
  },
  {
    id: "cls2",
    title: "Leadership Bootcamp — Q3",
    courses: [{ courseId: "c2", mandatory: false }],
    trainerId: "u9",
    memberIds: ["u1", "u6"],
    startDate: "2026-09-01",
    endDate: "2026-09-28",
    status: "upcoming",
  },
  {
    id: "cls3",
    title: "Onboarding — August Intake",
    courses: [{ courseId: "c3", mandatory: true }],
    trainerId: "u8",
    memberIds: ["u7"],
    startDate: "2026-07-01",
    endDate: "2026-07-14",
    status: "completed",
  },
  {
    id: "cls4",
    title: "Health & Safety Refresher — Sept Intake",
    courses: [{ courseId: "c4", mandatory: true }],
    trainerId: "u9",
    memberIds: ["u2", "u3", "u6"],
    startDate: "2026-09-05",
    endDate: "2026-09-19",
    status: "upcoming",
  },
  {
    id: "cls5",
    title: "Excel Reporting Workshop",
    courses: [
      { courseId: "c5", mandatory: false },
      { courseId: "c8", mandatory: false },
    ],
    trainerId: "u8",
    memberIds: ["u1", "u3", "u7"],
    startDate: "2026-08-18",
    endDate: "2026-09-08",
    status: "active",
  },
  {
    id: "cls6",
    title: "Anti-Harassment Training — July Cohort",
    courses: [{ courseId: "c6", mandatory: true }],
    trainerId: "u9",
    memberIds: ["u1", "u2", "u6", "u7"],
    startDate: "2026-07-05",
    endDate: "2026-07-19",
    status: "completed",
  },
  {
    id: "cls7",
    title: "Client Communication Bootcamp",
    courses: [{ courseId: "c7", mandatory: false }],
    trainerId: "u8",
    memberIds: ["u2", "u6"],
    startDate: "2026-08-20",
    endDate: "2026-09-10",
    status: "active",
  },
  {
    id: "cls8",
    title: "Project Management Fundamentals",
    courses: [{ courseId: "c8", mandatory: false }],
    trainerId: "u9",
    memberIds: ["u3", "u7"],
    startDate: "2026-08-15",
    endDate: "2026-09-05",
    status: "active",
  },
  {
    id: "cls9",
    title: "Data Protection Cohort — Sept 2026",
    courses: [{ courseId: "c1", mandatory: true }],
    trainerId: "u9",
    memberIds: ["u6", "u7"],
    startDate: "2026-09-10",
    endDate: "2026-09-24",
    status: "upcoming",
  },
];

// Assignments belong to either a class (classId — only that cohort gets it)
// or a course (courseId — everyone enrolled in the course gets it).
export const mockAssignments = [
  {
    id: "asg-c2",
    courseId: "c2",
    title: "Team Improvement Plan",
    instructions: "Write a 2-3 page improvement plan for a real or hypothetical team you manage: current state, one specific feedback framework you'll apply, and how you'll measure progress over the next quarter.",
    dueDate: null,
    createdAt: "2026-02-14",
    status: "open",
    autoCloseOnDueDate: false,
  },
  {
    id: "asg-c8",
    courseId: "c8",
    title: "Mini Project Plan",
    instructions: "Submit a project charter (PDF or Word doc) for a small project of your choice: scope, timeline, key milestones, and a basic risk register with at least 3 identified risks.",
    dueDate: null,
    createdAt: "2026-04-18",
    status: "open",
    autoCloseOnDueDate: false,
  },
  {
    id: "asg1",
    classId: "cls1",
    title: "Data handling audit",
    instructions: "Pick one workflow on your team that touches customer data and write up how it should change after this course. Submit as a PDF or Word doc.",
    dueDate: "2026-08-22",
    createdAt: "2026-08-11",
    status: "open",
    autoCloseOnDueDate: false,
  },
  {
    id: "asg2",
    classId: "cls1",
    title: "Team onboarding checklist review",
    instructions: "Review your team's onboarding checklist against what you learned in this course and flag any gaps. Submit as a PDF or Word doc.",
    dueDate: "2026-09-05",
    createdAt: "2026-08-12",
    status: "open",
    autoCloseOnDueDate: true,
  },
  {
    id: "asg3",
    classId: "cls1",
    title: "Draft compliance memo (archived)",
    instructions: "Early draft exercise from the first week of the cohort — kept here for reference.",
    dueDate: "2026-08-10",
    createdAt: "2026-08-05",
    status: "closed",
    autoCloseOnDueDate: false,
  },
];

// Per-topic discussion — a handful of seeded comments so the feature reads
// as already in use, not an empty box.
export const mockComments = [
  {
    id: "cmt1",
    courseId: "c1",
    topicId: "c1-t1",
    userId: "u2",
    text: "Good refresher — didn't realize our retention policy applied to Slack DMs too.",
    createdAt: "2026-08-15T09:12:00.000Z",
  },
  {
    id: "cmt2",
    courseId: "c1",
    topicId: "c1-t1",
    userId: "u3",
    text: "Same here. Does this apply to data we hold on former customers too, or just active ones?",
    createdAt: "2026-08-15T11:40:00.000Z",
  },
  {
    id: "cmt3",
    courseId: "c1",
    topicId: "c1-t1",
    userId: "u6",
    text: "Bookmarking this video — the incident reporting steps are exactly what I needed for onboarding my new hire.",
    createdAt: "2026-08-20T14:05:00.000Z",
  },
];

export const currentUserId = "u1";
