import React from 'react';
import { NavLink } from 'react-router-dom';
import { Radar, Zap, Clock, BarChart2, HeartPulse, Brain, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const links = [
    { to: '/', label: 'Request Analyzer', icon: Zap },
    { to: '/history', label: 'History', icon: Clock },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/health', label: 'Health Monitor', icon: HeartPulse },
    { to: '/insights', label: 'Smart Insights', icon: Brain },
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
            <div className="flex items-center gap-2.5">
              <Radar className="w-5.5 h-5.5 text-accent animate-pulse" />
              <span className="font-semibold text-base tracking-wide text-primary">PacketSight</span>
            </div>
            
            {/* Close Button on Mobile */}
            <button 
              onClick={onClose}
              className="text-secondary hover:text-primary md:hidden p-1 rounded-btn hover:bg-bg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose} // Auto-close sidebar on mobile link click
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-btn text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                      isActive
                        ? 'bg-accent text-white font-bold'
                        : 'text-secondary hover:text-primary hover:bg-[#222533]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
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
