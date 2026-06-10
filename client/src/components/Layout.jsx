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

      {/* Primary content area with copyright footer */}
      <main className="flex-1 md:ml-[220px] p-4 md:p-6 lg:p-8 min-h-screen flex flex-col justify-between overflow-y-auto">
        <div className="flex-grow">
          <Outlet />
        </div>
        <footer className="mt-12 pt-4 border-t border-border/20 text-center text-[10px] text-secondary font-mono tracking-wide select-none">
          © {new Date().getFullYear()} PacketSight. All rights reserved.
        </footer>
      </main>
    </div>
  );
};

export default Layout;
