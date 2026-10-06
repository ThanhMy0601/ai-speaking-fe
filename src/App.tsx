import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import RoadmapPage from "./pages/RoadmapPage";
import PracticeRoomPage from "./pages/PracticeRoomPage";
import SessionHistoryPage from "./pages/SessionHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import VocabularyPage from "./pages/VocabularyPage";
import SessionReportPage from "./pages/SessionReportPage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminTopicsPage from "./pages/admin/AdminTopicsPage";
import AdminTopicFormPage from "./pages/admin/AdminTopicFormPage";

function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/roadmap" replace />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="practice/:type" element={<PracticeRoomPage />} />
          <Route path="sessions" element={<SessionHistoryPage />} />
          <Route path="sessions/:id" element={<SessionReportPage />} />
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Cosmetic gate only — Admin::BaseController#require_admin is what
              actually enforces this, and it raises Forbidden. */}
          <Route
            path="admin/topics"
            element={
              <AdminRoute>
                <AdminTopicsPage />
              </AdminRoute>
            }
          />
          <Route
            path="admin/topics/:id"
            element={
              <AdminRoute>
                <AdminTopicFormPage />
              </AdminRoute>
            }
          />
        </Route>
        {/* Catch-all. Without it, a bad URL rendered a blank page under the
            nav with no indication anything was wrong. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
