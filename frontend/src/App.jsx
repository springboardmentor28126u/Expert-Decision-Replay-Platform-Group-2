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
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateDecision />} />
        <Route path="/decisions" element={<DecisionList />} />
        <Route path="/upload" element={<UploadDocument />} />
        <Route path="/alternatives" element={<Alternatives />} />
        <Route path="/comments" element={<Comments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/decision/:id" element={<DecisionDetails />} />
        <Route path="/decision/edit/:id" element={<EditDecision />} />
        <Route path="/decision/history/:id" element={<DecisionHistory />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;