import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/dashboard/Dashboard";

import Users from "./pages/admin/Users";
import Teams from "./pages/admin/Teams";

// Decision Pages
import DecisionList from "./pages/decisions/DecisionList";
import CreateDecision from "./pages/decisions/CreateDecision";
import EditDecision from "./pages/decisions/EditDecision";
import DecisionDetails from "./pages/decisions/DecisionDetails";
import Alternatives from "./pages/decisions/Alternative";
import Knowledge from "./pages/decisions/Knowledge";
import VersionHistory from "./pages/decisions/VersionHistory";
import Attachment from "./pages/decisions/Attachment";
import CategoryList from "./pages/categories/CategoryList";
import CreateCategory from "./pages/categories/CreateCategory";
import CategoryDetails from "./pages/categories/CategoryDetails";
function App() {
  return (
    <Routes>

      {/* Authentication */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Users & Teams */}
      <Route path="/users" element={<Users />} />
      <Route path="/admin/teams" element={<Teams />} />

      {/* Decision Management */}
      <Route path="/decisions" element={<DecisionList />} />
      <Route path="/decisions/create" element={<CreateDecision />} />
      <Route path="/decisions/:id" element={<DecisionDetails />} />
      <Route path="/decisions/:id/edit" element={<EditDecision />} />

      {/* Future Modules */}
      {/* <Route path="/categories" element={<Categories />} /> */}
      {/* <Route path="/reports" element={<Reports />} /> */}
      {/* <Route path="/profile" element={<Profile />} /> */}
      {/* Decision Management */}


      {/* Decision Sub Pages */}
      <Route path="/decisions/:id/alternatives" element={<Alternatives />}/>

      <Route path="/decisions/:id/knowledge" element={<Knowledge />} />

      <Route path="/decisions/:id/history" element={<VersionHistory />} />
      <Route path="/decisions/:id/attachments" element={<Attachment />} />
      <Route
    path="/categories"
    element={<CategoryList />}
/>

<Route path="/categories/create" element={<CreateCategory />} />

<Route path="/categories/:id" element={<CategoryDetails />}/>

    </Routes>
  );
}

export default App;