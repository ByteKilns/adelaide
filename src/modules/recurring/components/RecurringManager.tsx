"use client";

import { useMemo, useState } from "react";

import { Calendar as CalendarIcon, ChevronDown, List, Plus, Search } from "lucide-react";

import { DataTable } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DateFormat } from "@/lib/date-format-cookie";
import { RecurringCalendarView } from "@/modules/recurring/components/RecurringCalendarView";
import { type RecurringExpenseEditing, RecurringForm } from "@/modules/recurring/components/RecurringForm";
import { type RecurringRow, useRecurringTableColumns } from "@/modules/recurring/hooks/useRecurringTableColumns";

type Tab = "active" | "all" | "completed" | "paused" | "upcoming";

type Category = { id: string; name: string };
type Member = { id: string; name: string };

type Props = {
  categories: Category[];
  currentMemberId: string;
  dateFormat: DateFormat;
  members: Member[];
  realMemberId: string;
  rows: RecurringRow[];
};

export function RecurringManager({ categories, currentMemberId, dateFormat, members, realMemberId, rows }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"calendar" | "list">("list");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<null | RecurringExpenseEditing>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: RecurringRow) {
    setEditing({
      amount: row.amount,
      categoryId: categories.find((c) => c.name === row.categoryName)?.id ?? "",
      endDate: row.endDate,
      frequency: row.frequency,
      icon: row.icon as RecurringExpenseEditing["icon"],
      id: row.id,
      name: row.name,
      nextDueDate: row.nextDueDate,
      ownerMemberId: row.ownerMemberId,
      vendor: row.vendor ?? "",
    });
    setFormOpen(true);
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab === "active" && r.status !== "active") return false;
      if (tab === "paused" && r.status !== "paused") return false;
      if (tab === "completed" && r.status !== "completed") return false;
      if (tab === "upcoming" && (r.status !== "active" || r.paidThisMonth)) return false;
      if (search.trim() && !r.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [rows, tab, search]);

  const columns = useRecurringTableColumns(realMemberId, openEdit, dateFormat);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabSwitcher
          onValueChange={(v) => setTab(v as Tab)}
          tabs={[
            { label: "All", value: "all" },
            { label: "Upcoming", value: "upcoming" },
            { label: "Active", value: "active" },
            { label: "Paused", value: "paused" },
            { label: "Completed", value: "completed" },
          ]}
          value={tab}
        />
        <Button onClick={openAdd} type="button">
          <Plus className="h-4 w-4" />
          Add Recurring
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recurring..."
            value={search}
          />
        </div>
        {/* Owner/Category/Frequency filters are visual placeholders, matching
            ExpenseFilters — filtering logic isn't wired up yet. */}
        {["All Owners", "All Categories", "All Frequency"].map((label) => (
          <Button className="text-muted-foreground" disabled key={label} type="button" variant="outline">
            {label}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        ))}
        <Button onClick={() => setView(view === "list" ? "calendar" : "list")} type="button" variant="outline">
          {view === "list" ? <CalendarIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
          {view === "list" ? "Calendar View" : "List View"}
        </Button>
      </div>

      {view === "calendar" ? (
        <RecurringCalendarView dateFormat={dateFormat} rows={filtered} />
      ) : (
        <DataTable
          columns={columns}
          emptyMessage="No recurring expenses in this view."
          itemLabel="recurring items"
          rowKey={(r) => r.id}
          rows={filtered}
        />
      )}

      <RecurringForm
        categories={categories}
        currentMemberId={currentMemberId}
        editing={editing}
        key={editing?.id ?? "new"}
        members={members}
        onOpenChange={setFormOpen}
        open={formOpen}
      />
    </div>
  );
}
