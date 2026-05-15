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
      destructive: "bg-red-500/20 text-red-500",
      outline: "border border-outline/50 bg-transparent text-primary hover:bg-outline/10",
      positive: "bg-green-500/20 dark:bg-green-400/20 text-positive hover:bg-green-500/30 dark:hover:bg-green-400/30",
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