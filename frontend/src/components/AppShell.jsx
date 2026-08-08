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
        <aside className="shell-sidebar" style={{ display: "flex", flexDirection: "column" }}>
          <div className="shell-logo">
            <span className="full-name">EDRP</span>
          </div>

          <nav className="shell-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
                onClick={() => onNavigate(item.key)}
                style={{ position: "relative" }}
              >
                <span className="shell-nav-icon">{item.icon}</span>
                <span className="label">{item.label}</span>
                {!!item.badge && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "var(--danger)",
                      color: "#fff",
                      borderRadius: "999px",
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 5px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
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
                  >
                    <span className="shell-nav-icon">{item.icon}</span>
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
      )}

      <div className="shell-main">
        <header className="shell-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "16px",
              }}
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ProfileMenu profile={profile} />
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
