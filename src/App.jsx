import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./components/Sidebar";
import PublicShell from "./components/PublicShell";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import LearnerDashboard from "./pages/LearnerDashboard";
import CourseCatalog from "./pages/CourseCatalog";
import CoursePlayer from "./pages/CoursePlayer";
import MyCoursesPage from "./pages/MyCoursesPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourses from "./pages/AdminCourses";
import CourseManagePage from "./pages/CourseManagePage";
import TrainerCourses from "./pages/TrainerCourses";
import AdminUsers from "./pages/AdminUsers";
import AdminClasses from "./pages/AdminClasses";
import AdminEnroll from "./pages/AdminEnroll";
import ClassesCatalog from "./pages/ClassesCatalog";
import CertificatesPage from "./pages/CertificatesPage";
import AdminCertificates from "./pages/AdminCertificates";
import CertificateDesigner from "./pages/CertificateDesigner";
import TrainerDashboard from "./pages/TrainerDashboard";
import ClassMaterialsPage from "./pages/ClassMaterialsPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import CourseQuizPage from "./pages/CourseQuizPage";
import ClassQuizPage from "./pages/ClassQuizPage";
import QuizzesPage from "./pages/QuizzesPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import ToastContainer from "./components/ToastContainer";
import { selectCurrentUser, selectIsAuthenticated } from "./store/slices/authSlice";

function RequireRole({ allowed, children }) {
  const currentUser = useSelector(selectCurrentUser);
  if (!allowed.includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomeWithMenu onMenuClick={() => setMobileOpen(true)} />} />
          <Route path="/catalog" element={<CourseCatalog onMenuClick={() => setMobileOpen(true)} />} />
          <Route path="/course/:courseId" element={<CoursePlayer onMenuClick={() => setMobileOpen(true)} />} />
          <Route path="/course/:courseId/topic/:topicId/quiz" element={<CourseQuizPage onMenuClick={() => setMobileOpen(true)} />} />
          <Route
            path="/my-courses"
            element={
              <RequireRole allowed={["learner"]}>
                <MyCoursesPage onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route path="/classes" element={<ClassesCatalog onMenuClick={() => setMobileOpen(true)} />} />
          <Route path="/classes/:classId" element={<ClassDetailPage onMenuClick={() => setMobileOpen(true)} />} />
          <Route path="/classes/:classId/quiz" element={<ClassQuizPage onMenuClick={() => setMobileOpen(true)} />} />
          <Route path="/quizzes" element={<QuizzesPage onMenuClick={() => setMobileOpen(true)} />} />
          <Route path="/assignments" element={<AssignmentsPage onMenuClick={() => setMobileOpen(true)} />} />
          <Route
            path="/certificates"
            element={
              <RequireRole allowed={["learner"]}>
                <CertificatesPage onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/classes/:classId/manage"
            element={
              <RequireRole allowed={["admin", "trainer"]}>
                <ClassMaterialsPage onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole allowed={["admin"]}>
                <AdminDashboard onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <RequireRole allowed={["admin"]}>
                <AdminCourses onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/courses/:courseId/manage"
            element={
              <RequireRole allowed={["admin"]}>
                <CourseManagePage onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/trainer/courses"
            element={
              <RequireRole allowed={["trainer"]}>
                <TrainerCourses onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/trainer/courses/:courseId/manage"
            element={
              <RequireRole allowed={["trainer"]}>
                <CourseManagePage onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole allowed={["admin"]}>
                <AdminUsers onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <RequireRole allowed={["admin"]}>
                <AdminClasses onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/certificates"
            element={
              <RequireRole allowed={["admin"]}>
                <AdminCertificates onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/certificates/:courseId/design"
            element={
              <RequireRole allowed={["admin"]}>
                <CertificateDesigner onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/enroll"
            element={
              <RequireRole allowed={["admin"]}>
                <AdminEnroll onMenuClick={() => setMobileOpen(true)} />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function HomeWithMenu({ onMenuClick }) {
  const currentUser = useSelector(selectCurrentUser);
  if (currentUser.role === "admin") return <AdminDashboard onMenuClick={onMenuClick} />;
  if (currentUser.role === "trainer") return <TrainerDashboard onMenuClick={onMenuClick} />;
  return <LearnerDashboard onMenuClick={onMenuClick} />;
}

// Anonymous visitors only ever see the landing page, the public catalog and
// a course's sign-in gate — everything else redirects back to the landing page.
function PublicRoutes() {
  return (
    <PublicShell>
      <Routes>
        <Route path="/catalog" element={<CourseCatalog />} />
        <Route path="/course/:courseId" element={<CoursePlayer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicShell>
  );
}

export default function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<PublicRoutes />} />
        </Routes>
      </>
    );
  }

  if (currentUser?.role === "trainer" && (currentUser?.status === "pending" || currentUser?.status === "denied")) {
    return (
      <>
        <ToastContainer />
        <PendingApprovalPage />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </>
  );
}
