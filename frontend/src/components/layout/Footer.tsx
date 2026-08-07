import { Link } from 'react-router-dom';
import { Github, TrendingUp, ExternalLink } from 'lucide-react';

const productLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/watchlist', label: 'Watchlist' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/screener', label: 'Screener' },
    { to: '/search', label: 'Search' },
];

// Repo link — update if you fork or move the project.
const GITHUB_URL = 'https://github.com/anshs-12/stoxy';

export const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="relative border-t border-border-light bg-base">
            <div className="max-w-[1200px] mx-auto px-3 md:px-5 py-5 md:py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                    {/* Brand */}
                    <div className="space-y-10">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-md bg-neutral flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-accent" />
                            </div>
                            <h3 className="font-heading font-semibold text-lg tracking-tight text-primary">
                                Stoxy Finance<span className="text-accent">.</span>
                            </h3>
                        </div>
                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[14px] font-sans font-medium text-muted hover:text-accent transition-colors"
                        >
                            <Github className="h-5 w-5" />
                            <span>Star on GitHub</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                        </a>
                    </div>

                    {/* Product — two columns with heading */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-mono text-muted tracking-[0.18em] uppercase">
                            Product
                        </h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            {productLinks.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="text-[13px] font-sans text-muted hover:text-accent transition-colors"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* About — sits in column 3 */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-mono text-muted tracking-[0.18em] uppercase">
                            About
                        </h4>
                        <p className="text-[12px] font-sans text-muted leading-relaxed">
                            Live NSE prices, watchlists, portfolio, and AI analysis — built for retail investors who want clarity over noise.
                        </p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-[12px] font-sans font-medium text-primary">
                                © {year} Stoxy Finance. All rights reserved.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
