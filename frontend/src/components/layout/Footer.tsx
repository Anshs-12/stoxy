import { Link } from 'react-router-dom';
import { Github, TrendingUp, Coffee } from 'lucide-react';

const productLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/indices', label: 'Indices' },
    { to: '/watchlist', label: 'Watchlist' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/screener', label: 'Screener' },
    { to: '/search', label: 'Search' },
];

const GITHUB_URL = 'https://github.com/anshs-12/stoxy';
const BMC_URL = 'https://buymeacoffee.com/anshx12';

export const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="relative border-t border-border-light bg-base font-mono">
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-5 md:py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 pb-6">
                    {/* Brand column */}
                    <div>
                        <div className="flex items-center gap-2.5 pb-3.5">
                            <div className="h-7 w-7 bg-neutral flex items-center justify-center">
                                <TrendingUp className="h-3.5 w-3.5 text-accent" />
                            </div>
                            <div className="font-heading font-semibold text-base tracking-tight text-primary">
                                Stoxy <span className="text-accent">Finance</span>
                            </div>
                        </div>
                        <p className="text-[12.5px] text-muted leading-[1.7] max-w-[280px] mb-4">
                            Live NSE prices, watchlists, portfolio tracking, and AI-powered
                            analysis — built for retail investors who want clarity over noise.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={GITHUB_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gh-btn inline-flex items-center gap-1.5 h-[34px] px-3 border border-border text-[12px] text-muted no-underline cursor-pointer transition-colors hover:border-accent hover:text-accent"
                            >
                                <Github className="h-[15px] w-[15px]" />
                                <span className="text-accent">★</span>
                                <span>Star on GitHub</span>
                            </a>
                            <a
                                href={BMC_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bmc-btn inline-flex items-center gap-1.5 h-[34px] px-3 border border-border text-[12px] text-muted no-underline cursor-pointer transition-colors hover:borbder-accent hover:text-accent"
                            >
                                <Coffee className="h-[15px] w-[15px]" />
                                <span>Buy me a coffee</span>
                            </a>
                        </div>
                    </div>

                    {/* Product column — centered vertically & horizontally */}
                    <div className="flex flex-col items-center justify-center text-center self-stretch">
                        <h3 className="text-[11px] tracking-[0.12em] text-muted uppercase mb-3 font-medium">
                            Product
                        </h3>
                        <div className="grid grid-cols-2 gap-x-10 gap-y-[9px]">
                            {productLinks.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="text-[13px] text-muted no-underline transition-colors hover:text-accent"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* About column — wider, centered, more breathing room */}
                    <div className="flex flex-col items-center justify-center text-center self-stretch">
                        <h3 className="text-[11px] tracking-[0.12em] text-muted uppercase mb-3 font-medium">
                            About
                        </h3>
                        <p className="text-[12.5px] text-muted leading-[1.7] max-w-[280px]">
                            Real-time market data via Upstox WebSocket feed, RAG-powered AI
                            analysis, and a UI built to cut through noise — not add to it.
                        </p>
                        <div className="flex items-center gap-1.5 mt-4 text-[11.5px] text-positive">
                            <span className="w-[5px] h-[5px] bg-positive shadow-[0_0_6px_var(--color-positive)]" />
                            All systems operational
                        </div>
                    </div>
                </div>

                {/* Footer bottom */}
                <div className="max-w-[1240px] mx-auto pt-5 border-t border-border-light flex justify-between items-center flex-wrap gap-3 text-[11.5px] text-muted">
                    <span>© {year} Stoxy Finance. All rights reserved.</span>
                    <div className="flex gap-5">
                        <a href="#" className="text-muted no-underline hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="text-muted no-underline hover:text-primary transition-colors">Terms</a>
                        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-muted no-underline hover:text-primary transition-colors">GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};