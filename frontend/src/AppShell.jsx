import "./dashboard-shell.css";
import ProfileMenu from "./ProfileMenu";

function AppShell({ profile, activeView, onNavigate, onLogout, children }) {
  const isManagerOrAdmin = profile.role === "manager" || profile.role === "admin";
  const isAdmin = profile.role === "admin";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "decisions", label: "Decisions", icon: "📋" },
  ];

  const adminNavItems = [
    { key: "users", label: "User Management", icon: "👥" },
  ];

  return (
    <div className="shell-wrapper">
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
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <h1 className="shell-topbar-title">
            {activeView === "dashboard" && "Dashboard"}
            {activeView === "decisions" && "Decisions"}
            {activeView === "users" && "User Management"}
            {activeView === "account" && "Account Settings"}
            {activeView === "decision-details" && "Decision Details"}
          </h1>
          <ProfileMenu
            profile={profile}
            onLogout={onLogout}
            onManageAccount={() => onNavigate("account")}
          />
        </header>

        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;