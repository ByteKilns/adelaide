"use client";

import { useMemo, useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { TabSwitcher } from "@/components/TabSwitcher";
import { Button } from "@/components/ui/button";
import type { DateFormat } from "@/lib/date-format-cookie";
import { deleteDhukuAction } from "@/modules/dhuku/api/dhuku.actions";
import { DhukuCard } from "@/modules/dhuku/components/DhukuCard";
import { DhukuEntryForm } from "@/modules/dhuku/components/DhukuEntryForm";
import { type DhukuEditing, DhukuForm } from "@/modules/dhuku/components/DhukuForm";
import type { DhukuCardData } from "@/modules/dhuku/lib/dhuku-stats";

type Tab = "active" | "all" | "completed";

type Member = { id: string; name: string };

type Props = {
  currentMemberId: string;
  dateFormat: DateFormat;
  dhukus: DhukuCardData[];
  members: Member[];
  realMemberId: string;
};

export function DhukuManager({ currentMemberId, dateFormat, dhukus, members, realMemberId }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DhukuEditing | null>(null);
  const [entryDhuku, setEntryDhuku] = useState<DhukuCardData | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(dhuku: DhukuCardData) {
    setEditing({
      id: dhuku.id,
      interestPerMonth: dhuku.interestPerMonth,
      monthlyContribution: dhuku.monthlyContribution,
      name: dhuku.name,
      note: dhuku.note ?? "",
      ownerMemberId: dhuku.ownerMemberId,
      startDate: dhuku.startDate,
      totalMembers: dhuku.totalMembers,
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this dhuku? Its entry history will be removed too.")) return;
    try {
      await deleteDhukuAction(id);
      toast.success("Dhuku deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const filtered = useMemo(() => {
    if (tab === "all") return dhukus;
    return dhukus.filter((d) => d.status === tab);
  }, [dhukus, tab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabSwitcher
          onValueChange={(v) => setTab(v as Tab)}
          tabs={[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Completed", value: "completed" },
          ]}
          value={tab}
        />

        <Button onClick={openAdd} type="button">
          <Plus className="h-4 w-4" />
          Add Dhuku
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No dhukus in this view.</p>}
        {filtered.map((dhuku) => (
          <DhukuCard
            dateFormat={dateFormat}
            dhuku={dhuku}
            key={dhuku.id}
            onAddEntry={setEntryDhuku}
            onDelete={handleDelete}
            onEdit={openEdit}
            realMemberId={realMemberId}
          />
        ))}
      </div>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 text-sm font-medium text-primary hover:bg-primary/5"
        onClick={openAdd}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Add a Dhuku
      </button>

      <DhukuForm
        currentMemberId={currentMemberId}
        editing={editing}
        key={editing?.id ?? "new"}
        members={members}
        onOpenChange={setFormOpen}
        open={formOpen}
      />

      <DhukuEntryForm
        dhuku={entryDhuku}
        key={entryDhuku?.id ?? "none"}
        onOpenChange={(open) => !open && setEntryDhuku(null)}
        open={entryDhuku !== null}
      />
    </div>
  );
}
