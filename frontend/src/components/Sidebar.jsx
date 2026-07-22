import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaClipboardList,
  FaUpload,
  FaComments,
  FaBalanceScale,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar() {
  return (
    <div
      className="bg-dark text-white d-flex flex-column shadow"
      style={{
        width: "260px",
        minHeight: "100vh",
      }}
    >
      <div className="text-center py-4 border-bottom border-secondary">
        <h3 className="fw-bold text-info">EDRP</h3>
        <small className="text-light">
          Expert Decision Platform
        </small>
      </div>

      <div className="p-3">

        <NavLink
          to="/dashboard"
          className="nav-link text-white mb-2 rounded p-3"
        >
          <FaHome className="me-2" />
          Dashboard
        </NavLink>

        <NavLink
          to="/create"
          className="nav-link text-white mb-2 rounded p-3"
        >
          <FaClipboardList className="me-2" />
          Create Decision
        </NavLink>

        <NavLink
          to="/decisions"
          className="nav-link text-white mb-2 rounded p-3"
        >
          <FaClipboardList className="me-2" />
          Decisions
        </NavLink>

        <NavLink
          to="/upload"
          className="nav-link text-white mb-2 rounded p-3"
        >
          <FaUpload className="me-2" />
          Documents
        </NavLink>

        <NavLink
          to="/alternatives"
          className="nav-link text-white mb-2 rounded p-3"
        >
          <FaBalanceScale className="me-2" />
          Alternatives
        </NavLink>

        <NavLink
          to="/comments"
          className="nav-link text-white mb-2 rounded p-3"
        >
          <FaComments className="me-2" />
          Comments
        </NavLink>

        <NavLink
          to="/profile"
          className="nav-link text-white mb-2 rounded p-3"
        >
          <FaUser className="me-2" />
          Profile
        </NavLink>

      </div>

      <div className="mt-auto p-3">

        <NavLink
          to="/"
          className="btn btn-danger w-100"
        >
          <FaSignOutAlt className="me-2" />
          Logout
        </NavLink>

      </div>

    </div>
  );
}

export default Sidebar;