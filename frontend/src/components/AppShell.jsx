import { useState } from "react";
import "../styles/dashboard-shell.css";
import ProfileMenu from "./ProfileMenu";

function AppShell({ profile, activeView, onNavigate, onLogout, unreadCount, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const role = profile.role?.name;
  const isManagerOrAdmin = role === "manager" || role === "administrator";
  const isAdmin = role === "administrator";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "decisions", label: "Decisions", icon: "📋" },
    { key: "notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
  ];

  const managerNavItems = [
    { key: "reports", label: "Reports", icon: "📈" },
  ];

  const adminNavItems = [
    { key: "users", label: "User Management", icon: "👥" },
  ];

  return (
    <div className="shell-wrapper">
      {sidebarOpen && (
        <aside className="shell-sidebar">
          <div className="shell-logo">
            <span className="full-name">EDRP</span>
          </div>

          <nav className="shell-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                onClick={() => onNavigate(item.key)}
                aria-current={activeView === item.key ? "page" : undefined}
              >
                <span className="shell-nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="label">{item.label}</span>
                {!!item.badge && (
                  <span className="shell-nav-badge">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            ))}

            {isManagerOrAdmin && (
              <>
                <div className="shell-nav-divider" />
                <div className="shell-nav-section-label">Reports</div>
                {managerNavItems.map((item) => (
                  <button
                    key={item.key}
                    className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                    onClick={() => onNavigate(item.key)}
                    aria-current={activeView === item.key ? "page" : undefined}
                  >
                    <span className="shell-nav-icon" aria-hidden="true">{item.icon}</span>
                    <span className="label">{item.label}</span>
                  </button>
                ))}
              </>
            )}

            {isAdmin && (
              <>
                <div className="shell-nav-divider" />
                <div className="shell-nav-section-label">Admin</div>
                {adminNavItems.map((item) => (
                  <button
                    key={item.key}
                    className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                    onClick={() => onNavigate(item.key)}
                    aria-current={activeView === item.key ? "page" : undefined}
                  >
                    <span className="shell-nav-icon" aria-hidden="true">{item.icon}</span>
                    <span className="label">{item.label}</span>
                  </button>
                ))}
              </>
            )}
          </nav>

          <div className="shell-sidebar-footer">
            <button
              className={`shell-nav-item ${activeView === "account" ? "active" : ""}`}
              onClick={() => onNavigate("account")}
              aria-current={activeView === "account" ? "page" : undefined}
            >
              <span className="shell-nav-icon" aria-hidden="true">⚙️</span>
              <span className="label">Account Settings</span>
            </button>
            <button
              className="shell-nav-item danger"
              onClick={onLogout}
            >
              <span className="shell-nav-icon" aria-hidden="true">🚪</span>
              <span className="label">Log Out</span>
            </button>
          </div>
        </aside>
      )}

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar-left">
            <button
              className="shell-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              ☰
            </button>
            <h1 className="shell-topbar-title">
              {activeView === "dashboard" && "Dashboard"}
              {activeView === "decisions" && "Decisions"}
              {activeView === "notifications" && "Notifications"}
              {activeView === "reports" && "Reports"}
              {activeView === "users" && "User Management"}
              {activeView === "account" && "Account Settings"}
              {activeView === "decision-details" && "Decision Details"}
            </h1>
          </div>

          {/* Header Controls */}
          <div className="shell-topbar-right">
            <ProfileMenu profile={profile} />
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
