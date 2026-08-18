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
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "decisions", label: "Decisions", icon: ClipboardList },
    { key: "reports", label: "Reports", icon: BarChart3 },
    { key: "my-team", label: "My Team", icon: Users },
    { key: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
  ];

  const adminNavItems = [
    { key: "users", label: "User Management", icon: "UserCog" },
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

          {isAdmin && (
            <>
              <div className="shell-nav-divider" />
              <div className="shell-nav-section-label">Admin</div>
              {adminNavItems.map((item) => {
                // If it's a string, we might need a fallback or let Lucide handle it, but wait!
                // The item.icon for user-management is "UserCog", so let's render it properly or fallback to UserCog icon
                const IconComponent = UserCog;
                return (
                  <button
                    key={item.key}
                    className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                    onClick={() => onNavigate(item.key)}
                  >
                    <span className="shell-nav-icon"> 
                      <IconComponent size={18} strokeWidth={1.8} />
                    </span>
                    <span className="label">{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <h1 className="shell-topbar-title">
            {activeView === "dashboard" && "Dashboard"}
            {activeView === "decisions" && "Decisions"}
            {activeView === "reports" && "Reports"}
            {activeView === "my-team" && "My Team"}
            {activeView === "notifications" && "Notifications"}
            {activeView === "users" && "User Management"}
            {activeView === "account" && "Account Settings"}
            {activeView === "decision-details" && "Decision Details"}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {topbarExtra}
            <ProfileMenu profile={profile} onNavigate={onNavigate} onLogout={onLogout} />
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