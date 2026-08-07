import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DecisionList from "./pages/DecisionList";
import CreateDecision from "./pages/CreateDecision";
import Alternatives from "./pages/Alternatives";
import Comments from "./pages/Comments";
import UploadDocument from "./pages/UploadDocument";
import Profile from "./pages/Profile";
import DecisionDetails from "./pages/DecisionDetails";
import EditDecision from "./pages/EditDecision";
import DecisionHistory from "./pages/DecisionHistory";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import ApprovalWorkflow from "./pages/ApprovalWorkflow";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Decisions */}
        <Route path="/create" element={<CreateDecision />} />
        <Route path="/decisions" element={<DecisionList />} />
        <Route path="/decision/:id" element={<DecisionDetails />} />
        <Route path="/decision/edit/:id" element={<EditDecision />} />
        <Route path="/decision/history/:id" element={<DecisionHistory />} />

        {/* Documents */}
        <Route path="/upload" element={<UploadDocument />} />

        {/* Alternatives */}
        <Route path="/alternatives" element={<Alternatives />} />

        {/* Comments */}
        <Route path="/comments" element={<Comments />} />

        {/* Approval Workflow */}
        <Route path="/approvals" element={<ApprovalWorkflow />} />

        {/* Reports */}
        <Route path="/reports" element={<Reports />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/audit" element={<AuditLogs />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;