import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`
        bg-surface 
        backdrop-blur-sm
        border-none
        shadow-ambient
        ${className}
      `}
      {...props}
    />
  )
);
Card.displayName = "Card";