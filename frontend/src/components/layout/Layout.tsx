import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface w-full overflow-x-hidden">
      {/* Sidebar: Fixed width w-64 */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content wrapper: shifted left by 64 (16rem) on desktop */}
      <div className="flex flex-1 flex-col min-h-screen lg:pl-64 relative w-full min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full min-w-0">
          <div className="mx-auto max-w-7xl w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
