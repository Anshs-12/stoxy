import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, User, ChevronDown, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { stocksApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
interface SearchResult { stockName: string; stockSymbol: string; }

export const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { setTheme, isDark } = useTheme();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDropdown(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      stocksApi.search(query, 0, 8)
        .then(r => { setResults(r.data.content || []); setShowDropdown(true); })
        .catch(() => setResults([]));
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectStock = (symbol: string) => {
    setQuery(''); setShowDropdown(false);
    navigate(`/stocks/${symbol}`);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-base dark:bg-surface border-b border-border-light px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 transition-colors">
      <div className="flex items-center gap-4 md:gap-10">
        <button className="md:hidden p-1 text-muted hover:text-primary transition-colors" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>
        <NavLink to="/" className="text-base font-manrope font-medium tracking-tight whitespace-nowrap hidden sm:block">
          NSE Precision
        </NavLink>
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: 'Market', to: '/' }, 
            { label: 'Watchlist', to: '/watchlist' }, 
            { label: 'Portfolio', to: '/portfolio' },
            { label: 'Screener', to: '/screener' },
            { label: 'Search', to: '/search' }
          ].map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `text-[13px] font-inter transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted hover:text-muted-heavy'}`
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-5">
        {/* Search */}
        <div className="relative" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search TCS, Reliance..."
            className="bg-neutral text-[13px] pl-9 pr-4 py-1.5 rounded w-36 sm:w-48 lg:w-64 border-none outline-none focus:bg-neutral placeholder:text-muted font-inter transition-colors" />
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface academic-shadow border border-border-light rounded z-50 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <button key={i} onClick={() => selectStock(r.stockSymbol)}
                  className="w-full text-left px-4 py-2.5 hover:bg-neutral transition-colors flex justify-between items-center group">
                  <span className="text-[13px] font-medium">{r.stockName}</span>
                  <span className="text-[11px] text-muted font-inter tracking-wider group-hover:text-muted">{r.stockSymbol}</span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && query.length >= 2 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface academic-shadow border border-border-light rounded z-50 p-4">
              <p className="text-[12px] text-muted text-center">No stocks found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-muted">
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="hover:text-primary transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="hover:text-primary transition-colors"><Bell className="h-4 w-4" /></button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-1.5 hover:text-primary transition-colors">
              {user ? (
                <div className="h-7 w-7 rounded-full bg-neutral flex items-center justify-center font-medium text-[11px] text-muted-heavy uppercase">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <div className="h-7 w-7 rounded-full bg-neutral flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-muted" />
                </div>
              )}
              <ChevronDown className={`h-3 w-3 transition-transform text-muted ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {showProfile && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-surface academic-shadow border border-border-light z-50">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-border-light">
                      <p className="text-[13px] font-medium truncate">{user.name}</p>
                      <p className="text-[11px] text-muted truncate mt-0.5">{user.email}</p>
                    </div>
                    <button onClick={() => { setShowProfile(false); navigate('/portfolio'); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-neutral transition-colors">
                      Portfolio
                    </button>
                    <button onClick={() => { setShowProfile(false); navigate('/watchlist'); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-neutral transition-colors">
                      Watchlist
                    </button>
                    <div className="border-t border-border-light" />
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-red-600/70 hover:bg-red-50 transition-colors flex items-center gap-2">
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </>
                ) : (
                  <a href="/api/v2/oauth2/authorization/google"
                    className="flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-neutral transition-colors">
                    <User className="h-4 w-4 text-muted" /> Sign in with Google
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};