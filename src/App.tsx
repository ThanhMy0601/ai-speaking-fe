import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import RoadmapPage from "./pages/RoadmapPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import PracticeRoomPage from "./pages/PracticeRoomPage";
import SessionHistoryPage from "./pages/SessionHistoryPage";
import ProfilePage from "./pages/ProfilePage";

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
          <Route path="lessons/:id" element={<LessonDetailPage />} />
          <Route path="practice/:type" element={<PracticeRoomPage />} />
          <Route path="sessions" element={<SessionHistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
