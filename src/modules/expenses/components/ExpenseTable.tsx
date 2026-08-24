"use client";

import { useMemo, useState } from "react";

import { CalendarDays, ChevronDown, Search } from "lucide-react";

import { DataTable } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DateFormat } from "@/lib/date-format-cookie";
import { type ExpenseRow, useExpenseTableColumns } from "@/modules/expenses/hooks/useExpenseTableColumns";

type Props = {
  dateFormat: DateFormat;
  partnerName: string | null;
  realMemberId: string;
  rows: ExpenseRow[];
};

type Tab = "all" | "me" | "partner" | "shared";

export function ExpenseTable({
  dateFormat,
  partnerName,
  realMemberId,
  rows,
}: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const columns = useExpenseTableColumns(realMemberId, dateFormat);

  const hasActiveFilters =
    search.trim() !== "" || startDate !== "" || endDate !== "";

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "me" && r.ownerMemberId !== realMemberId) return false;
      if (tab === "shared" && r.ownerMemberId !== null) return false;
      if (
        tab === "partner" &&
        (r.ownerMemberId === null || r.ownerMemberId === realMemberId)
      )
        return false;
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      if (query) {
        const haystack =
          `${r.categoryName} ${r.note ?? ""} ${r.ownerName ?? ""} ${r.paidByName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rows, tab, realMemberId, startDate, endDate, search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-2 py-3 shadow-[0_2px_12px_rgba(102,45,145,0.06)]">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-muted pl-8"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            value={search}
          />
        </div>
        <label className="flex items-center gap-1.5 rounded-lg border border-input bg-muted px-2.5 py-1.5 text-sm text-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            aria-label="From date"
            className="w-28 bg-transparent outline-none"
            onChange={(e) => setStartDate(e.target.value)}
            type="date"
            value={startDate}
          />
          <span className="text-muted-foreground/60">to</span>
          <input
            aria-label="To date"
            className="w-28 bg-transparent outline-none"
            onChange={(e) => setEndDate(e.target.value)}
            type="date"
            value={endDate}
          />
        </label>

        <div className="mx-1 h-5 w-px shrink-0 bg-border" />

        {["Category", "Owner", "Paid by"].map((label) => (
          <Button
            className="text-muted-foreground"
            disabled
            key={label}
            type="button"
            variant="outline"
          >
            {label}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        ))}
        <Button
          className="ml-auto text-muted-foreground"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
          type="button"
          variant="ghost"
        >
          Clear filters
        </Button>
      </div>

      <TabSwitcher
        className="w-full"
        onValueChange={(v) => setTab(v as Tab)}
        tabs={[
          { label: "All", value: "all" },
          { label: "Me", value: "me" },
          ...(partnerName ? [{ label: partnerName, value: "partner" }] : []),
          { label: "Shared", value: "shared" },
        ]}
        value={tab}
      />

      <DataTable
        columns={columns}
        emptyMessage="No expenses match these filters."
        itemLabel="expenses"
        rowKey={(r) => r.id}
        rows={filtered}
      />
    </div>
  );
}
