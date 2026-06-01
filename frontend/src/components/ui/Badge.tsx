import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'positive';
  className?: string;
}
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center rounded-md border font-medium text-xs px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variantClasses = {
      default: "bg-primary text-base",
      secondary: "bg-neutral text-primary",
      destructive: "bg-negative/15 text-negative",
      outline: "border border-border bg-transparent text-primary hover:bg-neutral",
      positive: "bg-positive/15 text-positive hover:bg-positive/25",
      accent: "bg-accent/15 text-accent hover:bg-accent/25",
    };
    
    return (
      <span
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";