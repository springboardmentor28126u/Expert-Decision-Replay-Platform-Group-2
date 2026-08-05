import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Layout
import Layout from "./components/layout/Layout";

// Common
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DecisionsPage from "./pages/DecisionsPage";
import DecisionDetailPage from "./pages/DecisionDetailPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";
import AuditLogsPage from "./pages/AuditLogsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import ReportsPage from "./pages/ReportsPage";
import MyApprovalsPage from "./pages/MyApprovalsPage";
import DecisionReportPage from "./pages/DecisionReportPage";
import ApprovalReportPage from "./pages/ApprovalReportPage";
import TeamReportPage from "./pages/TeamReportPage";
import AuditReportPage from "./pages/AuditReportPage";
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="decisions/:id" element={<DecisionDetailPage />} />

            {/* Approvals */}
            <Route
              path="decisions/:id/approvals"
              element={<ApprovalsPage />}
            />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/decision" element={<DecisionReportPage />} />
            <Route path="reports/approval" element={<ApprovalReportPage />} />
            <Route path="reports/team" element={<TeamReportPage />} />
            <Route path="reports/audit" element={<AuditReportPage />} />

            <Route path="profile" element={<ProfilePage />} />

            <Route
              path="my-approvals"
              element={<MyApprovalsPage />}
            />

            {/* Admin Only Routes */}
            <Route
              path="users"
              element={
                <ProtectedRoute roles={["Administrator"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute roles={['Administrator']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
