import { useEffect, useState } from 'react';
import { Activity, CalendarClock, CalendarDays, RefreshCw } from 'lucide-react';
import { marketApi } from '../../lib/api';
import type { MarketHoliday, MarketStatus } from '../../types';

const SESSION_START_MIN = 9 * 60 + 15; // 09:15 IST
const SESSION_END_MIN = 15 * 60 + 30;  // 15:30 IST

const fmtTime = (t?: string) => (t ? t.slice(0, 5) : '—');

const fmtDate = (d?: string) => {
  if (!d) return '—';
  const [y, mo, day] = d.split('-').map(Number);
  return new Date(y, mo - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const fmtDay = (d?: string) =>
  d ? d.charAt(0) + d.slice(1).toLowerCase() : '—';

const fmtToday = (dt: Date) =>
  `${dt.toLocaleDateString('en-IN', { month: 'short' })}, ${dt.getDate()}`;

const MarketStatusPage = () => {
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [holidays, setHolidays] = useState<MarketHoliday[] | null>(null);
  const [holidaysError, setHolidaysError] = useState(false);

  const [nowIST, setNowIST] = useState(() =>
    new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  );

  const load = () => {
    setLoading(true);
    marketApi
      .getStatus()
      .then(r => {
        setStatus(r.data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    marketApi
      .getHolidays()
      .then(r => setHolidays(r.data))
      .catch(() => setHolidaysError(true));
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setNowIST(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  const nowMin = nowIST.getHours() * 60 + nowIST.getMinutes();
  const markerPct = Math.min(100, Math.max(0, ((nowMin - SESSION_START_MIN) / (SESSION_END_MIN - SESSION_START_MIN)) * 100));
  const openPct = status?.isOpen
    ? Math.min(100, Math.max(0, ((nowMin - SESSION_START_MIN) / (SESSION_END_MIN - SESSION_START_MIN)) * 100))
    : 0;

  const countdown = status
    ? (() => {
        const [y, mo, d] = status.nextOpeningDate.split('-').map(Number);
        const [h, m] = status.nextOpeningTime.split(':').map(Number);
        const next = new Date(y, mo - 1, d, h, m).getTime();
        const diff = next - nowIST.getTime();
        if (diff <= 0) return 'Open now';
        const hrs = Math.floor(diff / 3.6e6);
        const mins = Math.floor((diff % 3.6e6) / 60000);
        return hrs > 0 ? `Opens in ${hrs}h ${mins}m` : `Opens in ${mins}m`;
      })()
    : null;

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const todayKey = `${nowIST.getFullYear()}-${pad2(nowIST.getMonth() + 1)}-${pad2(nowIST.getDate())}`;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-surface border border-border-light rounded-none p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-3.5 w-3.5 text-play" />
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
              Market / Status
            </span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-primary tracking-tight">
            Market <span className="text-play">Status</span>
          </h1>
          <p className="text-[13px] font-sans text-muted leading-relaxed max-w-[52ch] mt-1">
            Live NSE status from the exchange calendar — trading hours, holidays,
            and the next session, all in one place.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[16px] font-mono font-semibold text-primary tabular-nums">
            {fmtToday(nowIST)}
          </div>
          <div className="text-[9px] font-mono text-muted uppercase tracking-widest mt-0.5">
            Today · IST
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-surface border border-border-light p-6 md:p-8 rounded-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 text-muted" />
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
              NSE Session
            </h3>
            <span className="text-[10px] font-mono text-muted">· 09:15 – 15:30 IST</span>
          </div>
          <div className="relative flex items-center gap-4">
            <span className="hidden sm:inline text-[11px] font-mono text-muted tabular-nums">
              IST {nowIST.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false})}
            </span>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-[10px] font-mono text-muted hover:text-primary transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-[12px] font-mono text-negative">
            Could not reach the market status endpoint. Try refreshing.
          </p>
        ) : status ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Now */}
              <div className="bg-neutral px-5 py-5 flex flex-col justify-center gap-1.5">
                <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Now</span>
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${status.isOpen ? 'bg-positive animate-pulse' : 'bg-muted'}`} />
                  <span className={`text-[22px] font-mono font-bold tracking-wide ${
                    status.isOpen ? 'text-positive' : 'text-primary'
                  }`}>
                    {status.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted">Mon – Fri</span>
                {status.isOpen && (
                  <span className="text-[11px] font-mono text-positive">
                    Session {Math.round(openPct)}% complete
                  </span>
                )}
              </div>

              {/* Next opening */}
              <div className="bg-neutral px-5 py-5 flex flex-col justify-center gap-1.5">
                <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Next Opening</span>
                <div className="text-[15px] font-mono text-primary">
                  {fmtDay(status.nextOpeningDay)}, {fmtDate(status.nextOpeningDate)}
                </div>
                <div className="text-[15px] font-mono font-semibold text-play">
                  {fmtTime(status.nextOpeningTime)} IST
                </div>
                <span className="inline-flex self-start items-center px-2 py-0.5 border border-border-light text-[10px] font-mono text-muted mt-1">
                  {countdown}
                </span>
              </div>

              {/* Last closing */}
              <div className="bg-neutral px-5 py-5 flex flex-col justify-center gap-1.5">
                <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Last Closing</span>
                <div className="text-[15px] font-mono text-primary">
                  {fmtDay(status.lastClosingDay)}, {fmtDate(status.lastClosingDate)}
                </div>
                <div className="text-[15px] font-mono font-medium text-muted-heavy">
                  {fmtTime(status.lastClosingTime)} IST
                </div>
              </div>
            </div>

            {/* Session timeline */}
            <div className="mt-6">
              <div className="relative h-2 bg-muted/15">
                <div
                  className={`absolute inset-y-0 left-0 ${status.isOpen ? 'bg-positive' : 'bg-muted/40'}`}
                  style={{ width: `${openPct}%` }}
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 ${
                    status.isOpen
                      ? 'bg-play border-play'
                      : 'bg-surface border-muted'
                  }`}
                  style={{ left: `${markerPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-muted mt-1.5">
                <span>09:15</span>
                <span>12:00</span>
                <span>15:30</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[12px] font-mono text-muted">Fetching market status…</p>
        )}
      </div>

      {/* Holidays — inline below the session */}
      <div className="bg-surface border border-border-light p-6 md:p-8 rounded-none">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-5 w-5 text-play" />
            <h3 className="font-heading text-xl md:text-2xl font-semibold text-primary tracking-tight">
              NSE <span className="text-play">Holidays</span>
            </h3>
          </div>
          {holidays && (
            <span className="text-[10px] font-mono text-muted">
              {holidays.length} in calendar year
            </span>
          )}
        </div>
        {holidaysError || !holidays ? (
          <p className="text-[12px] font-mono text-negative">Could not load holidays.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 divide-y divide-border-light md:divide-y-0">
            {holidays.map(h => {
              const upcoming = h.date >= todayKey;
              return (
                <div
                  key={h.date}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-border-light last:border-b-0 md:border-b-0"
                >
                  <span className={`text-[12.5px] font-sans truncate ${
                    upcoming ? 'text-primary font-medium' : 'text-muted'
                  }`}>
                    {h.holidayName === h.date ? 'Holiday' : h.holidayName}
                  </span>
                  <span className={`text-[11px] font-mono tabular-nums whitespace-nowrap ${
                    upcoming ? 'text-play font-semibold' : 'text-muted'
                  }`}>
                    {fmtDay(h.date)} · {fmtDate(h.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[12px] md:text-[13px] font-mono text-primary leading-relaxed">
        Status is computed server-side from the exchange calendar (trading
        hours + NSE holidays).
      </p>
    </div>
  );
};

export default MarketStatusPage;