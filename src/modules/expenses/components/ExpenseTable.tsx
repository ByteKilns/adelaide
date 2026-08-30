"use client";

import { useMemo, useState } from "react";

import { CalendarDays, Search } from "lucide-react";

import { DataTable } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateFormat } from "@/lib/date-format-cookie";
import { type ExpenseRow, useExpenseTableColumns } from "@/modules/expenses/hooks/useExpenseTableColumns";
import { defaultExpenseFilters, type ExpenseTab, filterExpenseRows } from "@/modules/expenses/lib/expense-filters";

type Props = {
  categories: { groupName: string; id: string; name: string }[];
  dateFormat: DateFormat;
  members: { id: string; name: string }[];
  partnerName: string | null;
  realMemberId: string;
  rows: ExpenseRow[];
};

export function ExpenseTable({
  categories,
  dateFormat,
  members,
  partnerName,
  realMemberId,
  rows,
}: Props) {
  const [filters, setFilters] = useState(() => defaultExpenseFilters(realMemberId));
  const columns = useExpenseTableColumns(realMemberId, dateFormat);

  const hasActiveFilters =
    filters.query.trim() !== "" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.categoryId !== "all" ||
    filters.ownerFilter !== "all" ||
    filters.paidByMemberId !== "all";

  function clearFilters() {
    setFilters(defaultExpenseFilters(realMemberId));
  }

  const categoriesByGroup = useMemo(() => {
    const groups = new Map<string, { id: string; name: string }[]>();
    for (const c of categories) {
      const list = groups.get(c.groupName) ?? [];
      list.push({ id: c.id, name: c.name });
      groups.set(c.groupName, list);
    }
    return [...groups.entries()];
  }, [categories]);

  const filtered = useMemo(() => filterExpenseRows(rows, filters), [rows, filters]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card  p-2 shadow-[0_2px_12px_rgba(102,45,145,0.06)]">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-muted pl-8"
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search expenses..."
            value={filters.query}
          />
        </div>
        <label className="flex items-center gap-1.5 rounded-lg border border-input bg-muted px-2.5 py-1.5 text-sm text-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            aria-label="From date"
            className="w-28 bg-transparent outline-none"
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            type="date"
            value={filters.startDate}
          />
          <span className="text-muted-foreground/60">to</span>
          <input
            aria-label="To date"
            className="w-28 bg-transparent outline-none"
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            type="date"
            value={filters.endDate}
          />
        </label>

        <div className="mx-1 h-5 w-px shrink-0 bg-border" />

        <Select onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v }))} value={filters.categoryId}>
          <SelectTrigger className="text-muted-foreground" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Category</SelectItem>
            {categoriesByGroup.map(([groupName, groupCategories]) => (
              <SelectGroup key={groupName}>
                <SelectLabel>{groupName}</SelectLabel>
                {groupCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => setFilters((f) => ({ ...f, ownerFilter: v }))} value={filters.ownerFilter}>
          <SelectTrigger className="text-muted-foreground" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Owner</SelectItem>
            <SelectItem value="shared">Shared</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === realMemberId ? "Me" : m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => setFilters((f) => ({ ...f, paidByMemberId: v }))} value={filters.paidByMemberId}>
          <SelectTrigger className="text-muted-foreground" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Paid by</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === realMemberId ? "Me" : m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
        onValueChange={(v) => setFilters((f) => ({ ...f, tab: v as ExpenseTab }))}
        tabs={[
          { label: "All", value: "all" },
          { label: "Me", value: "me" },
          ...(partnerName ? [{ label: partnerName, value: "partner" }] : []),
          { label: "Shared", value: "shared" },
        ]}
        value={filters.tab}
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
