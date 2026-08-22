import "./dashboard-shell.css";
import { useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import { useState } from "react";
import AIAssistantButton from "./AIAssistantButton";
import AIAssistantPanel from "./AIAssistantPanel";

import {
  Bell,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  UserCog,
  Settings,
  LogOut,
  CheckCircle,
  FileSearch,
  Menu,
} from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const dashboardPaths = {
    employee: "/dashboard/employee",
    reviewer: "/dashboard/reviewer",
    manager: "/dashboard/manager",
    admin: "/dashboard/admin",
  };

  const handleNavClick = (item) => {
    if (item.key === "approved-decisions") {
      onNavigate("decisions", "approved");
    } else if (item.key === "audit-log") {
      onNavigate("reports", "audit");
    } else {
      onNavigate(item.key);
    }
  };

  const primaryNavItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "decisions", label: "Decisions", icon: ClipboardList },
    { key: "approved-decisions", label: "Approved Decisions", icon: CheckCircle },
    { key: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
  ];

  const reportsNavItems = [
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];

  const teamNavItems = [
    { key: "my-team", label: "My Team", icon: Users },
  ];

  const adminNavItems = [
    { key: "users", label: "User Management", icon: UserCog },
    { key: "audit-log", label: "Audit Log", icon: FileSearch },
  ];

  return (
    <div className="shell-wrapper">
      <aside className="shell-sidebar" style={{ display: sidebarOpen ? "flex" : "none", flexDirection: "column" }}>
        <div className="shell-logo">
          <span className="full-name">EDRP</span>
        </div>
        <nav className="shell-nav">
          {primaryNavItems.map((item) => (
            <button
              key={item.key}
              className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item)}
            >
              <span className="shell-nav-icon">
                <item.icon size={18} strokeWidth={1.8} />
              </span>
              <span className="label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="nav-badge" style={{
                    background: "var(--danger)",
                    color: "white",
                    borderRadius: "10px",
                    padding: "2px 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    marginLeft: "auto",
                  }}>
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
         
        {isManagerOrAdmin && (
          <>
          <div className="shell-nav-divider" />
          <div className="shell-nav-section-label">REPORTS</div>
          {reportsNavItems.map((item) => (
            <button
              key={item.key}
              className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item)}
            >
              <span className="shell-nav-icon">
                <item.icon size={18} strokeWidth={1.8} />
              </span>
              <span className="label">{item.label}</span>
            </button>
          ))}
         </>
        )} 

          {!isAdmin && (
            <>
              <div className="shell-nav-divider" />
              <div className="shell-nav-section-label">TEAM</div>
              {teamNavItems.map((item) => (
                <button
                  key={item.key}
                  className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                  onClick={() => handleNavClick(item)}
                >
                  <span className="shell-nav-icon">
                    <item.icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="label">{item.label}</span>
                </button>
              ))}
            </>
          )}

          {isAdmin && (
            <>
              <div className="shell-nav-divider" />
              <div className="shell-nav-section-label">ADMIN</div>
              {adminNavItems.map((item) => (
                <button
                  key={item.key}
                  className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                  onClick={() => handleNavClick(item)}
                >
                  <span className="shell-nav-icon"> 
                    <item.icon size={18} strokeWidth={1.8} />
                  </span>
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
            <span className="shell-nav-icon">
              <Settings size={18} strokeWidth={1.8} />
            </span>
            <span className="label">Account Settings</span>
          </button>
          <button
            className="shell-nav-item"
            onClick={onLogout}
            style={{ color: "var(--danger, #F0555A)" }}
          >
            <span className="shell-nav-icon">
              <LogOut size={18} strokeWidth={1.8} />
            </span>
            <span className="label">Log Out</span>
          </button>
        </div>
      </aside>

      <div className="shell-main">
      <header className="shell-topbar">
       <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Menu size={20} color="var(--text-primary)" />
          </button>
          <h1 className="shell-topbar-title">
            {activeView === "dashboard" && "Dashboard"}
            {activeView === "decisions" && "Decisions"}
            {activeView === "reports" && "Reports"}
            {activeView === "my-team" && "My Team"}
            {activeView === "notifications" && "Notifications"}
            {activeView === "users" && "User Management"}
            {activeView === "account" && "Account Settings"}
            {activeView === "decision-details" && "Decision Details"}
            {activeView === "approved-decisions" && "Approved Decisions"} 
            {activeView === "audit-log" && "Audit Log"}
          </h1>
        </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {topbarExtra}
            <ProfileMenu profile={profile} onNavigate={onNavigate} onLogout={onLogout} />
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>

      <AIAssistantButton onClick={() => setIsAIAssistantOpen(true)} />
      <AIAssistantPanel  
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        decisionId={selectedDecisionId} />
    </div>
  );
}

export default AppShell;