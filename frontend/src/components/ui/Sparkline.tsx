import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: { name: string; value: number }[];
  className?: string;
  color?: string;
}

export const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  ({ data, className, color = "#2E7D32" }, ref) => (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" tick={false} />
          <YAxis tick={false} width={0} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
            labelStyle={{ color: "var(--color-text-primary)" }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Value']}
          />
          <defs>
            <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.2} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
            fillOpacity={1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
);
Sparkline.displayName = "Sparkline";