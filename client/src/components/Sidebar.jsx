import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const links = [
    { to: '/', label: 'Request Analyzer' },
    { to: '/history', label: 'History' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/health', label: 'Health Monitor' },
    { to: '/insights', label: 'Smart Insights' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      <aside className={`fixed top-0 left-0 w-[220px] h-screen bg-panel border-r border-border flex flex-col justify-between p-4 z-50 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col gap-6">
          {/* Logo Section */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="font-semibold text-base tracking-wide text-primary">PacketSight</span>
            
            {/* Close Button on Mobile */}
            <button 
              onClick={onClose}
              className="text-secondary hover:text-primary md:hidden text-xs font-semibold px-1 py-0.5 rounded hover:bg-bg transition-colors"
            >
              [Close]
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-btn text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                      isActive
                        ? 'bg-accent text-white font-bold'
                        : 'text-secondary hover:text-primary hover:bg-[#222533]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Section */}
        <div className="px-2 pt-3 border-t border-border/40">
          <div className="text-[10px] text-secondary font-mono tracking-wider">
            PacketSight v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
