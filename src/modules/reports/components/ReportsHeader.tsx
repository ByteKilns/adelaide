"use client";

import { ChevronDown, ChevronLeft, ChevronRight, FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ExportRow = { amount: number; category: string; date: string; name: string; owner: string };

type Props = { exportRows: ExportRow[]; monthLabel: string };

function downloadCsv(rows: ExportRow[], monthLabel: string) {
  const header = ["Date", "Description", "Category", "Owner", "Amount"];
  const lines = [header, ...rows.map((r) => [r.date, r.name, r.category, r.owner, String(r.amount)])];
  const csv = lines.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${monthLabel.replace(" ", "-").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsHeader({ exportRows, monthLabel }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Understand your money, make better decisions</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Month navigation is a visual placeholder for now — switching months
            isn't wired up yet, matching the same pattern used across the app. */}
        <div
          aria-disabled="true"
          className="flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-foreground"
        >
          <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span className="flex items-center gap-1 px-2 text-sm font-medium">
            {monthLabel}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
        <Button onClick={() => downloadCsv(exportRows, monthLabel)} type="button" variant="outline">
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
