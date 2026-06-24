import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = (n: number | undefined | null) =>
  n != null ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

export const fmtCr = (n: number | undefined | null) => {
  if (n == null) return '—';
  const absN = Math.abs(n);
  if (absN >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`;
  if (absN >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (absN >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${fmt(n)}`;
};

export const getChangeColor = (change: number | undefined | null) => {
  if (change == null) return 'text-muted';
  return change >= 0 ? 'text-positive' : 'text-negative';
};

/**
 * Returns true if NSE/BSE markets are currently open.
 * Hours: Mon–Fri 09:15–15:30 IST (UTC+5:30).
 * NOTE: does not account for exchange holidays.
 */
export const isMarketOpen = (): boolean => {
  const now = new Date();
  // Convert to IST
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = ist.getHours();
  const m = ist.getMinutes();
  const totalMin = h * 60 + m;
  return totalMin >= 9 * 60 + 15 && totalMin <= 15 * 60 + 30;
};
