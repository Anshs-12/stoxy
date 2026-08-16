import {useState, useEffect, useRef} from 'react';
import {NavLink, useNavigate} from 'react-router-dom';
import {Search, Github, User, ChevronDown, LogOut, Menu, Moon, Sun} from 'lucide-react';
import {stocksApi, indexApi} from '../../lib/api';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../context/ThemeContext';
import {isMarketOpen} from '../../lib/utils';

interface SearchResult {
    stockName: string;
    stockSymbol: string;
    exchange: string;
    companyName: string;
    instrumentKey: string;
    isin: string;
}

interface IndexSearchResult {
    indexName: string;
    indexSymbol: string;
    exchange: string;
    segment: string;
    instrumentKey: string;
}

export const Header = ({onMenuClick}: { onMenuClick?: () => void }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [indexResults, setIndexResults] = useState<IndexSearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const navigate = useNavigate();
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const moreRef = useRef<HTMLDivElement>(null);
    const moreTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const {user, logout} = useAuth();
    const {theme, setTheme, isDark} = useTheme();

    // ── Live clock + market status ──
    const formatTime = () =>
        new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});
    const formatDate = () =>
        new Date().toLocaleDateString('en-IN', {weekday: 'short', day: '2-digit', month: 'short'});

    const [clockTime, setClockTime] = useState(formatTime);
    const [clockDate, setClockDate] = useState(formatDate);
    const [isMarketCurrentlyOpen, setIsMarketCurrentlyOpen] = useState(isMarketOpen);

    useEffect(() => {
        const t = setInterval(() => {
            setClockTime(formatTime());
            setClockDate(formatDate());
            setIsMarketCurrentlyOpen(isMarketOpen());
        }, 1000);
        return () => clearInterval(t);
    }, []);

    // Debounced search — stocks + indices in parallel
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIndexResults([]);
            setShowDropdown(false);
            return;
        }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            Promise.all([
                stocksApi.search(query, 0, 6)
                    .then(r => r.data.content || [])
                    .catch(() => []),
                indexApi.search(query)
                    .then(r => r.data.indexSearchDTOList || [])
                    .catch(() => []),
            ]).then(([stocks, indices]) => {
                setResults(stocks);
                setIndexResults(indices);
                setShowDropdown(true);
            });
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

    const selectStock = (stock: SearchResult) => {
        setQuery('');
        setShowDropdown(false);
        navigate(`/stocks/${stock.stockSymbol}`, {state: stock});
    };

    const selectIndex = (idx: IndexSearchResult) => {
        setQuery('');
        setShowDropdown(false);
        navigate(`/index/${encodeURIComponent(idx.instrumentKey)}`, {state: idx});
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <header
            className="bg-base border-b border-border-light px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 transition-colors">
            <div className="flex items-center gap-4 md:gap-10">
                <button className="md:hidden p-1 text-muted hover:text-primary transition-colors" onClick={onMenuClick}>
                    <Menu className="h-5 w-5"/>
                </button>
                <NavLink to="/"
                         className="flex items-center gap-1 text-base font-heading font-semibold tracking-tight whitespace-nowrap hidden sm:flex">
                    <span className="text-primary">Stoxy</span>
                    <span className="text-accent">.</span>
                </NavLink>
                <nav className="hidden md:flex items-center gap-6">
                    {[
                        {label: 'Market', to: '/'},
                        {label: 'Indices', to: '/indices'},
                        {label: 'Watchlist', to: '/watchlist'},
                        {label: 'Portfolio', to: '/portfolio'},
                        {label: 'Screener', to: '/screener'},
                        {label: 'Search', to: '/search'}
                    ].map(item => (
                        <NavLink key={item.to} to={item.to}
                                 className={({isActive}) =>
                                     `text-[13px] font-sans transition-colors pb-0.5 ${isActive
                                         ? 'text-primary font-semibold border-b-2 border-accent'
                                         : 'text-muted hover:text-accent border-b-2 border-transparent'}`
                                 }>
                            {item.label}
                        </NavLink>
                    ))}
                    <div
                        className="relative"
                        ref={moreRef}
                        onMouseEnter={() => {
                            if (moreTimerRef.current) clearTimeout(moreTimerRef.current);
                            setShowMore(true);
                        }}
                        onMouseLeave={() => {
                            moreTimerRef.current = setTimeout(() => setShowMore(false), 150);
                        }}
                    >
                        <button
                            className={`flex items-center gap-1 text-[13px] font-sans transition-colors pb-0.5 border-b-2 ${
                                showMore ? 'text-primary font-semibold border-accent' : 'text-muted hover:text-accent border-transparent'
                            }`}
                        >
                            More
                            <ChevronDown className={`h-3 w-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                        </button>
                        {showMore && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-36 bg-surface border border-border rounded-md z-50 shadow-ambient overflow-hidden">
                                {[{label: 'Learn', to: '/learn'},
                                  {label: 'Market Status', to: '/status'},
                                  {label: 'Contact', to: '/contact'}].map(item => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setShowMore(false)}
                                        className={({isActive}) =>
                                            `block w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                                                isActive ? 'text-accent font-medium' : 'text-primary hover:bg-neutral'
                                            }`
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted"/>
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                           placeholder="Search TCS, Reliance..."
                           className="bg-surface text-[13px] pl-9 pr-4 py-1.5 rounded-none w-36 sm:w-48 lg:w-64 border border-border-light outline-none focus:border-border font-sans transition-colors placeholder:text-muted"/>
                    {(showDropdown && (results.length > 0 || indexResults.length > 0)) && (
                        <div
                            className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-none z-50 max-h-80 overflow-y-auto shadow-ambient">
                            {results.length > 0 && (
                                <>
                                    <div
                                        className="px-4 pt-2.5 pb-1 text-[9px] font-mono text-muted uppercase tracking-widest">Stocks</div>
                                    {results.map((r) => (
                                        <button key={r.stockSymbol} onClick={() => selectStock(r)}
                                                className="w-full text-left px-4 py-2.5 transition-colors flex justify-between items-center gap-2">
                                            <div className="min-w-0">
                                                <div
                                                    className="text-[13px] font-medium text-primary truncate">{r.stockName}</div>
                                                <div className="text-[10px] text-muted">{r.companyName || r.stockName}</div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <span
                                                    className="text-[10px] font-mono text-muted tracking-wider">{r.stockSymbol}</span>
                                                {r.exchange && (
                                                    <span className={`text-[10px] font-mono font-medium ${
                                                        r.exchange === 'BSE' ? 'text-amber-500 dark:text-amber-400' : 'text-accent'
                                                    }`}>{r.exchange}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}
                            {indexResults.length > 0 && (
                                <>
                                    <div
                                        className="px-4 pt-2.5 pb-1 text-[9px] font-mono text-muted uppercase tracking-widest">Indices</div>
                                    {indexResults.map((r) => (
                                        <button key={r.instrumentKey} onClick={() => selectIndex(r)}
                                                className="w-full text-left px-4 py-2.5 transition-colors flex justify-between items-center gap-2">
                                            <div className="min-w-0">
                                                <div
                                                    className="text-[13px] font-medium text-primary truncate">{r.indexName}</div>
                                                <div className="text-[10px] text-muted">{r.segment}</div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <span
                                                    className="text-[10px] font-mono text-muted tracking-wider">{r.indexSymbol}</span>
                                                <span
                                                    className="text-[10px] font-mono font-medium text-accent">{r.exchange}</span>
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                    {showDropdown && query.length >= 2 && results.length === 0 && indexResults.length === 0 && (
                        <div
                            className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-none z-50 p-4 shadow-ambient">
                            <p className="text-[12px] text-muted text-center">No stocks or indices found for "{query}"</p>
                        </div>
                    )}
                </div>

                {/* ── Clock + Market Status ── */}
                <div
                    className="hidden lg:flex items-center gap-2 border border-border-light rounded-none px-3 py-1.5 bg-surface">
                    {/* Date */}
                    <span className="text-[10px] font-mono text-muted tracking-wide">{clockDate}</span>
                    <span className="text-[10px] text-muted/50">|</span>
                    {/* Market dot + status */}
                    <div className="flex items-center gap-1.5">
                        <div
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isMarketCurrentlyOpen ? 'bg-positive animate-pulse' : 'bg-muted'}`}/>
                        <span className={`text-[10px] font-mono tracking-wider ${
                            isMarketCurrentlyOpen ? 'text-positive' : 'text-muted'
                        }`}>
              {isMarketCurrentlyOpen ? 'NSE Open' : 'Closed'}
            </span>
                    </div>
                    <span className="text-[10px] text-muted/50">|</span>
                    {/* Live time */}
                    <span
                        className="text-[10px] font-mono text-primary font-semibold tracking-widest tabular-nums">{clockTime}</span>
                </div>

                <div className="flex items-center gap-3 text-muted">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
                        className="hover:text-primary transition-colors p-1.5 rounded-md hover:bg-neutral"
                        title={`Theme: ${theme}`}
                    >
                        {isDark ? <Sun className="h-4 w-4 text-accent"/> : <Moon className="h-4 w-4"/>}
                    </button>
                    <a href="https://github.com/anshs-12/stoxy" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors p-1.5 rounded-md hover:bg-neutral">
                        <Github className="h-4 w-4"/>
                    </a>

                    {/* Profile */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setShowProfile(v => !v)}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors">
                            {user ? (
                                <div
                                    className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center font-semibold text-[11px] text-accent uppercase">
                                    {user.name.charAt(0)}
                                </div>
                            ) : (
                                <div
                                    className="h-7 w-7 rounded-full bg-neutral border border-border flex items-center justify-center">
                                    <User className="h-3.5 w-3.5 text-muted"/>
                                </div>
                            )}
                            <ChevronDown
                                className={`h-3 w-3 transition-transform text-muted ${showProfile ? 'rotate-180' : ''}`}/>
                        </button>

                        {showProfile && (
                            <div
                                className="absolute top-full right-0 mt-2 w-56 bg-surface border border-border rounded-md z-50 shadow-ambient overflow-hidden">
                                {user ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-border-light">
                                            <p className="text-[13px] font-semibold truncate text-primary">{user.name}</p>
                                            <p className="text-[11px] text-muted truncate mt-0.5">{user.email}</p>
                                        </div>
                                        <button onClick={() => {
                                            setShowProfile(false);
                                            navigate('/portfolio');
                                        }}
                                                className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-neutral transition-colors text-primary">
                                            Portfolio
                                        </button>
                                        <button onClick={() => {
                                            setShowProfile(false);
                                            navigate('/watchlist');
                                        }}
                                                className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-neutral transition-colors text-primary">
                                            Watchlist
                                        </button>
                                        <div className="border-t border-border-light"/>
                                        <button onClick={handleLogout}
                                                className="w-full text-left px-4 py-2.5 text-[13px] text-negative hover:bg-negative/8 transition-colors flex items-center gap-2">
                                            <LogOut className="h-3.5 w-3.5"/> Sign out
                                        </button>
                                    </>
                                ) : (
                                    <a href={`${import.meta.env.VITE_API_URL}/oauth2/authorization/google`}
                                       className="flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-neutral transition-colors text-primary">
                                        <User className="h-4 w-4 text-muted"/> Sign in with Google
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