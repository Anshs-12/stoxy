import * as React from "react"

import { cn } from "@/lib/utils"

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => {
    return (
      <table
        ref={ref}
        className={cn("w-full text-sm", className)}
        {...props}
      />
    )
  }
)
Table.displayName = "Table"

interface TheadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const Thead = React.forwardRef<HTMLTableSectionElement, TheadProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
Thead.displayName = "Thead"

interface TbodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const Tbody = React.forwardRef<HTMLTableSectionElement, TbodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
Tbody.displayName = "Tbody"

interface TfootProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const Tfoot = React.forwardRef<HTMLTableSectionElement, TfootProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
Tfoot.displayName = "Tfoot"

interface TrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string
}

const Tr = React.forwardRef<HTMLTableRowElement, TrProps>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
Tr.displayName = "Tr"

interface ThProps extends React.HTMLAttributes<HTMLTableCellElement> {
  className?: string
}

const Th = React.forwardRef<HTMLTableCellElement, ThProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn("px-4 py-3 text-left text-xs font-medium tracking-wider text-muted uppercase", className)}
        {...props}
      />
    )
  }
)
Th.displayName = "Th"

interface TdProps extends React.HTMLAttributes<HTMLTableCellElement> {
  className?: string
}

const Td = React.forwardRef<HTMLTableCellElement, TdProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn("px-4 py-3 text-sm", className)}
        {...props}
      />
    )
  }
)
Td.displayName = "Td"

interface CaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  className?: string
}

const Caption = React.forwardRef<HTMLTableCaptionElement, CaptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn("px-4 py-2 text-sm text-muted caption-top", className)}
        {...props}
      />
    )
  }
)
Caption.displayName = "Caption"

export {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  Caption,
}