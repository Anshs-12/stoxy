import { CalendarRange } from 'lucide-react';
import { fmt } from '../../lib/utils';
import type { YearStats } from '../../hooks/useCandleStats';

/* ── 52W Range — compact card where LTP sits within the last 52 weeks.
 * 52W Low pinned far-left, 52W High pinned far-right; the LTP diamond and
 * its value chip sit at the true position on the track. ── */
export function YearRangeCard({
  yearStats,
  ltp,
  yearHighPct,
  lineColor,
}: {
  yearStats: YearStats | null;
  ltp: number | null;
  yearHighPct: number | null;
  lineColor: string;
}) {
  return (
    <div className="bg-surface border border-border-light p-5 rounded-none flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <CalendarRange className="h-3 w-3 text-muted" />
        <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
          52W Range
        </h3>
      </div>
      <div className="flex flex-col justify-center flex-1">
        <div className="relative pt-4 pb-6">
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-border" />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-negative"
            style={{ left: '0%' }}
          />
          <div
            className="absolute bottom-0 left-0 text-[9px] font-mono text-muted uppercase tracking-widest"
          >
            L
          </div>
          {yearHighPct != null && (
            <>
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border border-surface"
                style={{
                  left: `${100 - yearHighPct}%`,
                  backgroundColor: lineColor,
                  boxShadow: `0 0 0 3px ${lineColor}22`,
                }}
                title={`LTP ${ltp != null ? fmt(ltp) : ''}`}
              />
              {ltp != null && (
                <div
                  className="absolute -top-1 -translate-x-1/2 px-1 py-px text-[9px] font-mono font-semibold bg-surface border border-border-light rounded-none leading-none tabular-nums"
                  style={{ left: `${100 - yearHighPct}%`, color: lineColor }}
                >
                  <span className="text-muted font-bold">LTP&nbsp;</span>{fmt(ltp)}
                </div>
              )}
            </>
          )}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-positive"
            style={{ right: '0%' }}
          />
          <div
            className="absolute bottom-0 right-0 text-[9px] font-mono text-muted uppercase tracking-widest"
          >
            H
          </div>
        </div>
        <div className="flex items-start justify-between text-[13px] font-mono tabular-nums">
          <div>
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest font-bold">52W Low</div>
            <div className="text-negative mt-0.5">{yearStats?.yearLow != null ? fmt(yearStats.yearLow) : '—'}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest font-bold">52W High</div>
            <div className="text-positive mt-0.5">{yearStats?.yearHigh != null ? fmt(yearStats.yearHigh) : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}