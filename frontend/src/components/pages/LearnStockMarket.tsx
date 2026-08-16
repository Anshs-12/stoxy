import {
  BookOpen,
  Brain,
  LineChart,
  PieChart,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const MODULES = [
  { icon: BookOpen, title: 'Basics & Terminology', desc: 'Stocks, indices, exchanges, order types, and how the NSE actually works.' },
  { icon: TrendingUp, title: 'Candlestick Patterns', desc: 'Recognizing reversal and continuation setups at a glance.' },
  { icon: LineChart, title: 'Technical Analysis', desc: 'Support, resistance, trends, and reading price action.' },
  { icon: PieChart, title: 'Fundamental Analysis', desc: 'P/E, EPS, balance sheets, and what annual reports really say.' },
  { icon: ShieldCheck, title: 'Risk & Portfolio', desc: 'Position sizing, diversification, and not betting the house.' },
  { icon: Brain, title: 'Trading Psychology', desc: 'Discipline, journaling, and avoiding the classic mistakes.' },
];

const LearnStockMarket = () => {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-surface border border-border-light rounded-none p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-3.5 w-3.5 text-play" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
            Learn / Education
          </span>
        </div>
        <div className="min-w-0 max-w-[52ch]">
            <div className="flex items-center gap-6 flex-wrap">
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-primary tracking-tight">
                Learn Stock <span className="text-play">Market</span>
              </h1>
              <div className="shrink-0 -rotate-3">
                <div
                  className="text-2xl md:text-3xl font-bold leading-none"
                  style={{ fontFamily: "'Caveat', cursive", color: 'var(--color-play)' }}
                >
                  Coming Soon
                </div>
                <svg viewBox="0 0 140 14" className="w-28 h-3.5 mt-0.5 ml-1">
                  <path
                    d="M 2,9 Q 12,3 24,8 T 48,8 T 72,9 T 96,7 T 122,8 T 138,6"
                    fill="none"
                    stroke="var(--color-play)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <p className="text-[13px] font-sans text-muted leading-relaxed mt-2">
              From your first trade to reading candles like a pro — structured lessons,
              visual explainers, and zero fluff. Built for people who want to
              understand the market before they put money in it.
            </p>
          </div>
      </div>

      {/* Curriculum */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-surface border border-border-light p-5 rounded-none flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 bg-play/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-play" />
              </div>
              <span className="text-[9px] font-mono text-muted uppercase tracking-widest border border-border-light px-2 py-0.5">
                Coming soon
              </span>
            </div>
            <h3 className="font-heading text-[14px] font-medium text-primary tracking-tight mb-1.5">
              {title}
            </h3>
            <p className="text-[12px] font-sans text-muted leading-relaxed">
              {desc}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono text-muted">
        Curriculum under construction — drop a note on the Contact page if there&apos;s a
        topic you want covered first.
      </p>
    </div>
  );
};

export default LearnStockMarket;