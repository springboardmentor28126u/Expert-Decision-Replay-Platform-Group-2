import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import ReviewerDashboard from "./ReviewerDashboard";
import ManagerDashboard from "./ManagerDashboard";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState("login"); // "login" | "register" | "forgot"
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShowLanding(true);
    setView("login");
  };

  return (
    <Routes>
      <Route
        path="/dashboard/employee"
        element={
          token ? (
            <EmployeeDashboard token={token} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/dashboard/reviewer"
        element={
          token ? (
            <ReviewerDashboard token={token} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/dashboard/manager"
        element={
          token ? (
            <ManagerDashboard token={token} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          token ? (
            <AdminDashboard token={token} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          token ? (
            <Dashboard token={token} onLogout={handleLogout} />
          ) : showLanding ? (
            <Landing
              onLogin={() => {
                setShowLanding(false);
                setView("login");
              }}
              onSignup={() => {
                setShowLanding(false);
                setView("register");
              }}
            />
          ) : view === "register" ? (
            <Register
              onSwitch={() => setView("login")}
              onBackToLanding={() => setShowLanding(true)}
            />
          ) : view === "forgot" ? (
            <ForgotPassword onSwitch={() => setView("login")} />
          ) : (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onSwitch={() => setView("register")}
              onForgotPassword={() => setView("forgot")}
              onBackToLanding={() => setShowLanding(true)}
            />
          )
        }
      />
    </Routes>
  );
}

export default App;