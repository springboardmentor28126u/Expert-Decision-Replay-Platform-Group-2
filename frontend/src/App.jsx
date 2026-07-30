import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import DecisionList from "./components/DecisionList";
import DecisionForm from "./components/DecisionForm";
import DecisionDetails from "./components/DecisionDetails";

import AlternativeList from "./components/AlternativeList";
import AlternativeForm from "./components/AlternativeForm";
import AlternativeComparison from "./components/AlternativeComparison";
import Repository from "./components/Repository";
import Discussion from "./components/DiscussionRepo";
import VersionHistory from "./components/VersionHistory";
import Profile from "./components/Profile";
import Reports from "./components/Reports";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Decisions */}
        <Route
          path="/decisions"
          element={
            <ProtectedRoute>
              <DecisionList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/decision/new"
          element={
            <ProtectedRoute>
              <DecisionForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/decision/edit/:id"
          element={
            <ProtectedRoute>
              <DecisionForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/decision/:id"
          element={
            <ProtectedRoute>
              <DecisionDetails />
            </ProtectedRoute>
          }
        />

        {/* Alternatives */}
        <Route
          path="/decision/:decisionId/alternatives"
          element={
            <ProtectedRoute>
              <AlternativeList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alternative/new/:decisionId"
          element={
            <ProtectedRoute>
              <AlternativeForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alternative/edit/:id"
          element={
            <ProtectedRoute>
              <AlternativeForm />
            </ProtectedRoute>
          }
        />

        {/* Comparison */}
        <Route
          path="/comparison/:decisionId"
          element={
            <ProtectedRoute>
              <AlternativeComparison />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route
  path="/repository"
  element={
    <ProtectedRoute>
      <Repository />
    </ProtectedRoute>
  }
/>

<Route
  path="/discussions"
  element={
    <ProtectedRoute>
      <Discussion />
    </ProtectedRoute>
  }
/>
<Route
    path="/version-history"
    element={
      <ProtectedRoute>
    <VersionHistory />
    </ProtectedRoute>
  }
/>
<Route path="/profile" 
element={
  <ProtectedRoute>
<Profile />
</ProtectedRoute>} />
<Route
    path="/reports"
    element={
        <ProtectedRoute>
            <Reports />
        </ProtectedRoute>
    }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;