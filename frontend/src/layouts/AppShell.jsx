import { Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <span className="app-shell__mark">EDRP</span>
          <span className="app-shell__title">Expert Decision Replay Platform</span>
        </div>
        <nav className="app-shell__nav" aria-label="Primary">
          {/* Navigation links are added once Decisions, Approvals, and
              related feature pages exist. Authentication + User
              Management is the only milestone in scope right now. */}
        </nav>
      </header>

      <main className="app-shell__main">
        <Outlet />
      </main>

      <footer className="app-shell__footer">
        <span>Expert Decision Replay Platform</span>
        <span aria-hidden="true">·</span>
        <span>Internal record of organizational decisions</span>
      </footer>
    </div>
  );
}
