type Exchange = 'NSE' | 'BSE' | 'INDEX' | 'EQ' | string;

interface ExchangeBadgeProps {
  exchange: Exchange;
  className?: string;
}

// NSE → orange accent, BSE → yellow. No background/border — plain colored text.
const exchangeStyles: Record<string, string> = {
  NSE: 'text-accent',
  BSE: 'text-amber-500 dark:text-amber-400',
};

export const ExchangeBadge = ({ exchange, className = '' }: ExchangeBadgeProps) => {
  const style = exchangeStyles[exchange] ?? '';

  return (
    <span className={`text-[10px] font-mono font-medium ${style} ${className}`}>
      {exchange}
    </span>
  );
};