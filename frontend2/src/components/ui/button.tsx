import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva('button', { variants: { variant: { default: 'button--dark', orange: 'button--orange', outline: 'button--outline', ghost: 'button--ghost' }, size: { default: 'button--default', sm: 'button--small' } }, defaultVariants: { variant: 'default', size: 'default' } })
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />)
Button.displayName = 'Button'
