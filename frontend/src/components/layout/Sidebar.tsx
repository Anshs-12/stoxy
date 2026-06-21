import { NavLink } from 'react-router-dom';
import { LayoutGrid, Eye, SlidersHorizontal, Briefcase, Search, TrendingUp } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/watchlist', icon: Eye, label: 'Watchlist' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/screener', icon: SlidersHorizontal, label: 'Screener' },
  { to: '/search', icon: Search, label: 'Search' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm" onClick={onClose} />
      )}
      <aside className={`fixed md:relative top-0 left-0 h-full w-52 bg-base flex flex-col flex-shrink-0 border-r border-border-light z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Brand Header */}
        <div className="px-5 pt-6 pb-5 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-sm tracking-tight text-primary flex items-center gap-0.5">
                Stoxy<span className="text-accent">.</span>
              </h2>
              <p className="text-[9px] font-mono text-muted tracking-wider uppercase">NSE Live</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col px-3 py-4 gap-0.5">
          <p className="text-[9px] font-mono text-muted tracking-widest uppercase px-3 mb-2">Navigation</p>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-sans transition-all duration-200 relative ${
                  isActive
                    ? 'bg-accent/8 text-accent font-medium'
                    : 'text-muted hover:text-primary hover:bg-neutral'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full" />
                  )}
                  <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-accent' : 'text-muted group-hover:text-muted-heavy'}`} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-light">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] font-mono text-muted tracking-wider">v2.0 · Live</span>
          </div>
        </div>
      </aside>
    </>
  );
};
