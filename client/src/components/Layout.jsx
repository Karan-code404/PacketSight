import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col md:flex-row">
      {/* Mobile Top Navbar (hidden on desktop) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-panel border-b border-border sticky top-0 z-40 shrink-0">
        <span className="font-semibold text-sm tracking-wide text-primary">PacketSight</span>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-secondary hover:text-primary text-xs font-semibold px-2 py-1.5 rounded hover:bg-bg transition-colors"
        >
          [Menu]
        </button>
      </header>

      {/* Persistent Sidebar navigation */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Primary content area */}
      <main className="flex-1 md:ml-[220px] p-4 md:p-6 lg:p-8 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
