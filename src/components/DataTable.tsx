"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  align?: "left" | "right";
  className?: string;
  header: ReactNode;
  key: string;
  render: (row: T) => ReactNode;
};

const DEFAULT_PAGE_SIZE = 10;

type Props<T> = {
  columns: DataTableColumn<T>[];
  containerClassName?: string;
  emptyMessage?: string;
  itemLabel?: string;
  pageSize?: number;
  paginate?: boolean;
  rowKey: (row: T) => string;
  rows: T[];
};

// The Table/TableHeader/TableBody/TableRow/TableCell scaffolding was
// identical across every table in the app (BudgetGroupTable,
// BudgetVsActualTable, ExpenseTable, CategoriesManager) — only the column
// definitions and per-row rendering differed. This is that shared shell.
// Pagination lives here too, since every list table (ExpenseTable,
// RecurringManager, ...) was hand-rolling the same page/slice/prev-next logic.
export function DataTable<T>({
  columns,
  containerClassName,
  emptyMessage,
  itemLabel = "items",
  pageSize = DEFAULT_PAGE_SIZE,
  paginate = true,
  rowKey,
  rows,
}: Props<T>) {
  const [page, setPage] = useState(1);

  const pageCount = paginate
    ? Math.max(1, Math.ceil(rows.length / pageSize))
    : 1;
  // Clamping against pageCount (rather than resetting on every rows change)
  // keeps a filter/search/tab switch from ever pointing past the new end of
  // the list, without needing an effect to synchronize state.
  const currentPage = Math.min(page, pageCount);
  const pageRows = paginate
    ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : rows;

  return (
    <div className="space-y-3">
      <div
        className={cn("overflow-hidden rounded-lg border bg-card", containerClassName)}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  className={cn(
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                  key={column.key}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && emptyMessage && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  className="py-6 text-center whitespace-normal text-muted-foreground"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    className={cn(
                      column.align === "right" && "text-right",
                      column.className,
                    )}
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

      {paginate && rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, rows.length)} of {rows.length}{" "}
            {itemLabel}
          </p>
          <div className="flex items-center gap-1">
            <Button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              {currentPage} / {pageCount}
            </span>
            <Button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
