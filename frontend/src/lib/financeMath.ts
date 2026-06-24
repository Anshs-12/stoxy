import Big from 'big.js';

Big.DP = 10;
Big.RM = Big.roundHalfUp;

export function currentValue(qty: number, ltp: number): string {
  return new Big(qty).times(ltp).toFixed(2);
}

export function investedValue(qty: number, avgBuyPrice: number): string {
  return new Big(qty).times(avgBuyPrice).toFixed(2);
}

export function totalPnL(qty: number, ltp: number, avgBuyPrice: number): string {
  const cv = new Big(qty).times(ltp);
  const iv = new Big(qty).times(avgBuyPrice);
  return cv.minus(iv).toFixed(2);
}

export function totalPnLPercent(qty: number, ltp: number, avgBuyPrice: number): string {
  const pnl = new Big(qty).times(ltp).minus(new Big(qty).times(avgBuyPrice));
  const iv = new Big(qty).times(avgBuyPrice);
  if (iv.eq(0)) return '0';
  return pnl.div(iv).times(100).toFixed(2);
}

export function dayPnL(qty: number, ltp: number, close: number): string {
  return new Big(qty).times(new Big(ltp).minus(close)).toFixed(2);
}

export function dayPnLPercent(ltp: number, close: number): string {
  if (close === 0) return '0';
  return new Big(ltp).minus(close).div(close).times(100).toFixed(2);
}

export function portfolioTotals(
  stocks: Array<{ qty: number; ltp: number; avgBuyPrice: number; investedAmount: number }>
) {
  let totalCurrent = new Big(0);
  let totalInvested = new Big(0);
  let totalDayPnl = new Big(0);

  for (const s of stocks) {
    const cv = new Big(s.qty).times(s.ltp);
    const iv = new Big(s.investedAmount);
    const dpnl = new Big(s.qty).times(new Big(s.ltp).minus(s.avgBuyPrice));
    totalCurrent = totalCurrent.plus(cv);
    totalInvested = totalInvested.plus(iv);
    totalDayPnl = totalDayPnl.plus(dpnl);
  }

  const totalPnl = totalCurrent.minus(totalInvested);
  const totalPnlPct = totalInvested.eq(0) ? new Big(0) : totalPnl.div(totalInvested).times(100);

  return {
    totalCurrentValue: totalCurrent.toFixed(2),
    totalInvestedValue: totalInvested.toFixed(2),
    totalUnrealizedPnL: totalPnl.toFixed(2),
    totalUnrealizedPnLPercent: totalPnlPct.toFixed(2),
    totalDayPnL: totalDayPnl.toFixed(2),
  };
}

export function validateSlippage(userPrice: number, livePrice: number, side: 'buy' | 'sell'): boolean {
  const lp = new Big(livePrice);
  const up = new Big(userPrice);
  const threshold = lp.times(0.01);
  if (side === 'buy') {
    return up.minus(lp).abs().lte(threshold);
  }
  return lp.minus(up).abs().lte(threshold);
}

export function formatPrice(value: number | string): string {
  return new Big(value).toFixed(2);
}

export function watchlistDelta(currentPrice: number, priceAddedAt: number) {
  const change = new Big(currentPrice).minus(priceAddedAt);
  const pct = priceAddedAt === 0 ? new Big(0) : change.div(priceAddedAt).times(100);
  return {
    change: change.toFixed(2),
    changePercent: pct.toFixed(2),
  };
}
