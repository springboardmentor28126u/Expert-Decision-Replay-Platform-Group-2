import { NavLink } from "react-router-dom";

import {
  FaHome,
  FaClipboardList,
  FaCheckCircle,
  FaComments,
  FaChartBar,
  FaHistory,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar() {
  const linkStyle = ({ isActive }) => ({
    background: isActive ? "#2563eb" : "transparent",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "12px 15px",
    marginBottom: "8px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    transition: "0.3s",
    fontWeight: isActive ? "600" : "500",
  });

  return (
    <div
      className="bg-dark text-white d-flex flex-column shadow"
      style={{
        width: "260px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div className="text-center py-4 border-bottom border-secondary">
        <h3 className="fw-bold text-info">EDRP</h3>
        <small className="text-light">Expert Decision Platform</small>
      </div>

      {/* Navigation */}
      <div className="p-3">
        <NavLink to="/dashboard" style={linkStyle}>
          <FaHome className="me-3" />
          Dashboard
        </NavLink>

        <NavLink to="/decisions" style={linkStyle}>
          <FaClipboardList className="me-3" />
          Decisions
        </NavLink>

        <NavLink to="/approvals" style={linkStyle}>
          <FaCheckCircle className="me-3" />
          Approval Workflow
        </NavLink>

        <NavLink to="/comments" style={linkStyle}>
          <FaComments className="me-3" />
          Chats
        </NavLink>

        <NavLink to="/reports" style={linkStyle}>
          <FaChartBar className="me-3" />
          Reports
        </NavLink>

        <NavLink to="/audit" style={linkStyle}>
          <FaHistory className="me-3" />
          Audit Logs
        </NavLink>

        <NavLink to="/profile" style={linkStyle}>
          <FaUser className="me-3" />
          Profile
        </NavLink>
      </div>

      {/* Logout */}
      <div className="mt-auto p-3">
        <NavLink to="/" className="btn btn-danger w-100">
          <FaSignOutAlt className="me-2" />
          Logout
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;