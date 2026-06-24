import { Badge } from '@/components/ui/badge';

type Exchange = 'NSE' | 'BSE' | 'INDEX' | 'EQ' | string;

interface ExchangeBadgeProps {
  exchange: Exchange;
  className?: string;
}

const exchangeStyles: Record<string, string> = {
  NSE: 'text-blue-500 border-blue-500',
  BSE: 'text-orange-500 border-orange-500',
  INDEX: '',
  EQ: '',
};

export const ExchangeBadge = ({ exchange, className = '' }: ExchangeBadgeProps) => {
  const variant = exchange === 'INDEX' ? 'secondary' : exchange === 'EQ' ? 'outline' : 'outline';
  const style = exchangeStyles[exchange] ?? '';

  return (
    <Badge variant={variant} className={`text-[10px] font-mono ${style} ${className}`}>
      {exchange}
    </Badge>
  );
};
