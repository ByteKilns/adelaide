"use client";

import { useState } from "react";

import { ChevronDown, ChevronLeft, ChevronRight, FileDown, ListPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { downloadExpensesCsv, type ExpenseExportRow } from "@/lib/csv-export";
import { BulkAddExpenseModal } from "@/modules/expenses/components/BulkAddExpenseModal";

type Props = {
  categories: { groupName: string; id: string; name: string }[];
  currentMemberId: string;
  exportRows: ExpenseExportRow[];
  members: { id: string; name: string }[];
  monthLabel: string;
  nextHref: string;
  prevHref: string;
};

export function ExpenseHeader({ categories, currentMemberId, exportRows, members, monthLabel, nextHref, prevHref }: Props) {
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">Expenses</h1>
        <p className="text-sm text-muted-foreground">Track where your money goes</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          onClick={() => setBulkOpen(true)}
          type="button"
          variant="outline"
        >
          <ListPlus className="h-4 w-4" />
          Bulk add
        </Button>
        <Button
          className="border-foreground/20 font-medium"
          onClick={() => downloadExpensesCsv(exportRows, monthLabel)}
          type="button"
          variant="secondary"
        >
          <FileDown className="h-4 w-4" />
          Export
        </Button>
        <div className="flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-foreground">
          <Link aria-label="Previous month" className="rounded-full p-1 hover:bg-accent" href={prevHref}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="flex items-center gap-1 px-2 text-sm font-medium">
            {monthLabel}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <Link aria-label="Next month" className="rounded-full p-1 hover:bg-accent" href={nextHref}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <BulkAddExpenseModal
        categories={categories}
        currentMemberId={currentMemberId}
        members={members}
        onOpenChange={setBulkOpen}
        open={bulkOpen}
      />
    </div>
  );
}
