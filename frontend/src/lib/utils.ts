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
  return change >= 0 ? 'text-[#2E7D32]' : 'text-red-600/70';
};
