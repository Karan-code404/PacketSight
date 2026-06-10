import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Radar } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col md:flex-row">
      {/* Mobile Top Navbar (hidden on desktop/tablet) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-panel border-b border-border sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-accent animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-primary">PacketSight</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-secondary hover:text-primary p-1 rounded-btn hover:bg-bg transition-colors"
        >
          <Menu className="w-5.5 h-5.5" />
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
