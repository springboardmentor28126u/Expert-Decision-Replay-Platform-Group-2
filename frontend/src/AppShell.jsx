import "./dashboard-shell.css";
import ProfileMenu from "./ProfileMenu";

function AppShell({ profile, activeView, onNavigate, onLogout, unreadCount = 0, children }) {
  const isManagerOrAdmin = profile?.role === "manager" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin";

  // Sidebar navigation items including Notifications right under Decisions
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "decisions", label: "Decisions", icon: "📋" },
    { key: "notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
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
              onClick={() => onNavigate(item.key)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="shell-nav-icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </div>

              {/* Unread Count Badge */}
              {item.key === "notifications" && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: "#10B981", // Emerald Green
                    color: "#000000",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    borderRadius: "9999px",
                    padding: "2px 8px",
                    lineHeight: "1",
                  }}
                >
                  {item.badge}
                </span>
              )}
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
            {activeView === "dashboard" && "Dashboard"}
            {activeView === "decisions" && "Decisions"}
            {activeView === "notifications" && "Notifications"}
            {activeView === "users" && "User Management"}
            {activeView === "account" && "Account Settings"}
            {activeView === "decision-details" && "Decision Details"}
          </h1>
          
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