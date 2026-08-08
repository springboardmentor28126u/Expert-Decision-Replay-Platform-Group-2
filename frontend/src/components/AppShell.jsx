import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Bell,
  BarChart3,
  Users,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import "../styles/dashboard-shell.css";
import ProfileMenu from "./ProfileMenu";

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

function AppShell({ profile, activeView, onNavigate, onLogout, unreadCount, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const role = profile.role?.name;
  const isManagerOrAdmin = role === "manager" || role === "administrator";
  const isAdmin = role === "administrator";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "decisions", label: "Decisions", icon: FileText },
    { key: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
  ];

  const managerNavItems = [{ key: "reports", label: "Reports", icon: BarChart3 }];

  const adminNavItems = [{ key: "users", label: "User Management", icon: Users }];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        className={`shell-nav-item ${activeView === item.key ? "active" : ""}`}
        onClick={() => onNavigate(item.key)}
        aria-current={activeView === item.key ? "page" : undefined}
      >
        <Icon className="shell-nav-icon" size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
        <span className="label">{item.label}</span>
        {!!item.badge && (
          <span className="shell-nav-badge">{item.badge > 99 ? "99+" : item.badge}</span>
        )}
      </button>
    );
  };

  return (
    <div className="shell-wrapper">
      {sidebarOpen && (
        <aside className="shell-sidebar">
          <div className="shell-logo">
            <span className="shell-logo-mark" aria-hidden="true">E</span>
            <span className="full-name">EDRP</span>
          </div>

          <nav className="shell-nav">
            {navItems.map(renderNavItem)}

            {isManagerOrAdmin && (
              <div className="shell-nav-group">
                <div className="shell-nav-section-label">Reports</div>
                {managerNavItems.map(renderNavItem)}
              </div>
            )}

            {isAdmin && (
              <div className="shell-nav-group">
                <div className="shell-nav-section-label">Admin</div>
                {adminNavItems.map(renderNavItem)}
              </div>
            )}
          </nav>

          <div className="shell-sidebar-footer">
            <button
              className={`shell-nav-item ${activeView === "account" ? "active" : ""}`}
              onClick={() => onNavigate("account")}
              aria-current={activeView === "account" ? "page" : undefined}
            >
              <Settings className="shell-nav-icon" size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
              <span className="label">Account Settings</span>
            </button>
            <button className="shell-nav-item danger" onClick={onLogout}>
              <LogOut className="shell-nav-icon" size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
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
              {sidebarOpen ? (
                <PanelLeftClose size={18} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <PanelLeft size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
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
            <button
              type="button"
              className="shell-notif-btn"
              onClick={() => onNavigate("notifications")}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              title="Notifications"
            >
              <Bell size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
              {!!unreadCount && (
                <span className="shell-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>
            <ProfileMenu profile={profile} onNavigate={onNavigate} onLogout={onLogout} />
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
