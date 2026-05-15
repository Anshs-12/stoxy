import * as React from "react";

export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={`w-full text-sm text-left text-muted ${className || ''}`} {...props} />
);
Table.displayName = "Table";

export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`h-12 ${className || ''}`} {...props} />
);
TableHeader.displayName = "TableHeader";

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={`px-4 text-left text-xs font-medium text-muted uppercase tracking-wider h-12 ${className || ''}`} {...props} />
);
TableHead.displayName = "TableHead";

export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`bg-surface divide-y divide-neutral/20 ${className || ''}`} {...props} />
);
TableBody.displayName = "TableBody";

export const TableFooter = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tfoot className={`bg-surface ${className || ''}`} {...props} />
);
TableFooter.displayName = "TableFooter";

export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`hover:bg-neutral transition-colors ${className || ''}`} {...props} />
);
TableRow.displayName = "TableRow";

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-4 h-12 ${className || ''}`} {...props} />
);
TableCell.displayName = "TableCell";

export const TableCaption = ({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) => (
  <caption className={`mt-4 text-sm text-muted ${className || ''}`} {...props} />
);
TableCaption.displayName = "TableCaption";