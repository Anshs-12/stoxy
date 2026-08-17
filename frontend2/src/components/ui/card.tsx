import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) { return <article className={cn('ui-card', className)} {...props} /> }
