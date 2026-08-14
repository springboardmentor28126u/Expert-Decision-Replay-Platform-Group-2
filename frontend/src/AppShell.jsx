import "./dashboard-shell.css";
import { useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import { useState } from "react";
import AIAssistantButton from "./AIAssistantButton";
import AIAssistantPanel from "./AIAssistantPanel";

function AppShell({
  profile,
  activeView,
  onNavigate,
  onLogout,
  unreadCount,
  children,
  topbarExtra,
  selectedDecisionId,
}) {
  const navigate = useNavigate();
  const isManagerOrAdmin = profile.role === "manager" || profile.role === "admin";
  const isAdmin = profile.role === "admin";
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  
  const dashboardPaths = {
    employee: "/dashboard/employee",
    reviewer: "/dashboard/reviewer",
    manager: "/dashboard/manager",
    admin: "/dashboard/admin",
  };

  const handleNavClick = (item) => {
    onNavigate(item.key);
  };

  const navItems = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "decisions", label: "Decisions", icon: "📋" },
    { key: "reports", label: "Reports", icon: "📈" },
    { key: "my-team", label: "My Team", icon: "👥" },
  ];

  const adminNavItems = [
    { key: "users", label: "User Management", icon: "👥" },
  ];

  return (
    <div className="shell-wrapper">
      <aside className="shell-sidebar" style={{ display: "flex", flexDirection: "column" }}>
        <div className="shell-logo">
          <span className="full-name">EDRP</span>
        </div>
        <nav className="shell-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item)}
            >
              <span className="shell-nav-icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="shell-nav-divider" />
              <div className="shell-nav-section-label">Admin</div>
              {adminNavItems.map((item) => (
                <button
                  key={item.key}
                  className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                  onClick={() => onNavigate(item.key)}
                >
                  <span className="shell-nav-icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
          <button
            className={`shell-nav-item ${activeView === "account" ? "active" : ""}`}
            onClick={() => onNavigate("account")}
          >
            <span className="shell-nav-icon">⚙️</span>
            <span className="label">Account Settings</span>
          </button>
          <button
            className="shell-nav-item"
            onClick={onLogout}
            style={{ color: "#F0555A" }}
          >
            <span className="shell-nav-icon">🚪</span>
            <span className="label">Log Out</span>
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <h1 className="shell-topbar-title">
            {activeView === "home" && "Home"}
            {activeView === "dashboard" && "Dashboard"}
            {activeView === "decisions" && "Decisions"}
            {activeView === "reports" && "Reports"}
            {activeView === "my-team" && "My Team"}
            {activeView === "users" && "User Management"}
            {activeView === "account" && "Account Settings"}
            {activeView === "decision-details" && "Decision Details"}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {topbarExtra}
            <ProfileMenu profile={profile} />
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>

      <AIAssistantButton onClick={() => setIsAIAssistantOpen(true)} />
      <AIAssistantPanel isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} 
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        decisionId={selectedDecisionId} />
    </div>
  );
}

export default AppShell;