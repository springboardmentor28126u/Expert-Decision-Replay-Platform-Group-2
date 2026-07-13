import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Users from "./pages/Users";
import Teams from "./pages/Teams";
import DecisionList from "./pages/decisions/DecisionList";
import CreateDecision from "./pages/decisions/CreateDecision";
import DecisionDetails from "./pages/decisions/DecisionDetails";
import EditDecision from "./pages/decisions/EditDecision";
import AlternativeList from "./components/AlternativeList";
function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/users" element={<Users />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/decisions" element={<DecisionList />}/>

      
        <Route path="/decisions/create" element={<CreateDecision />} />
        <Route path="/decisions/edit/:id" element={<EditDecision />} />
        <Route path="/decisions/:id" element={<DecisionDetails />} />
        <Route path="/alternatives" element={<AlternativeList />} />
        {/* <Route path="/categories" element={<Categories />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} /> */}
      </Routes>
    </div>
  );
}

export default App;
