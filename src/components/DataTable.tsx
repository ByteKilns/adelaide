import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  align?: "left" | "right";
  className?: string;
  header: ReactNode;
  key: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  containerClassName?: string;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  rows: T[];
};

// The Table/TableHeader/TableBody/TableRow/TableCell scaffolding was
// identical across every table in the app (BudgetGroupTable,
// BudgetVsActualTable, ExpenseTable, CategoriesManager) — only the column
// definitions and per-row rendering differed. This is that shared shell.
export function DataTable<T>({ columns, containerClassName, emptyMessage, rowKey, rows }: Props<T>) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border", containerClassName)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead className={cn(column.align === "right" && "text-right", column.className)} key={column.key}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && emptyMessage && (
            <TableRow className="hover:bg-transparent">
              <TableCell className="py-6 text-center whitespace-normal text-muted-foreground" colSpan={columns.length}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell
                  className={cn(column.align === "right" && "text-right", column.className)}
                  key={column.key}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
