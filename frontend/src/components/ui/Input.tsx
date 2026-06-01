import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`
        block w-full rounded-sm border-b border-border 
        px-3 py-2 text-primary placeholder-neutral/50
        focus:border-primary/70 focus:bg-neutral/20 
        transition-all duration-200
        bg-transparent
        ${className}
      `}
      {...props}
    />
  )
);
Input.displayName = "Input";