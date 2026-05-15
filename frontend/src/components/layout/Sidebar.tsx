import { NavLink } from 'react-router-dom';
import { LayoutGrid, Eye, SlidersHorizontal, Briefcase, X } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/watchlist', icon: Eye, label: 'Watchlist' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/screener', icon: SlidersHorizontal, label: 'Screener' },
  { to: '/search', icon: LayoutGrid, label: 'Search' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 dark:bg-white/20 z-40 md:hidden" onClick={onClose} />
      )}
      <aside className={`fixed md:relative top-0 left-0 h-full w-48 bg-surface dark:bg-surface flex flex-col flex-shrink-0 border-r border-border-light z-50 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 pt-6 pb-4 flex justify-between items-start">
          <div>
            <h2 className="font-manrope font-medium text-sm tracking-tight">Terminal v1.0</h2>
            <p className="text-[9px] text-muted tracking-[0.12em] uppercase mt-0.5">NSE Live Market</p>
          </div>
          <button className="md:hidden text-muted hover:text-primary p-1" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2 mt-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-[13px] transition-all ${
                isActive
                  ? 'bg-green-500/20 dark:bg-green-400/20 text-positive dark:text-positive font-medium'
                  : 'text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      </aside>
    </>
  );
};