import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

/**
 * AppLayout — Reusable shell for authenticated / main application pages.
 * Wraps content with a persistent Navbar and a scrollable main area.
 */
function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-surface-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-surface-400 text-center">
            &copy; {new Date().getFullYear()} Expert Decision Replay Platform. Internal use only.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
