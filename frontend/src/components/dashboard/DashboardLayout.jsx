import { useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ sidebarItems, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a14]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar items={sidebarItems} collapsed={false} />
      </div>

      {/* Sidebar - desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          items={sidebarItems}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileOpen(!mobileOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
