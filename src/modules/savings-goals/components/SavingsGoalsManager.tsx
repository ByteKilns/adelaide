"use client";

import { useMemo, useState } from "react";

import { ChevronDown, Grid3x3, List, Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { Button } from "@/components/ui/button";
import type { DateFormat } from "@/lib/date-format-cookie";
import { roleForOwner } from "@/modules/expenses/lib/member-tone";
import { deleteSavingsGoalAction } from "@/modules/savings-goals/api/savings-goals.actions";
import { ContributionForm } from "@/modules/savings-goals/components/ContributionForm";
import { GoalCard, type GoalCardData } from "@/modules/savings-goals/components/GoalCard";
import { GoalForm, type SavingsGoalEditing } from "@/modules/savings-goals/components/GoalForm";
import { useGoalTableColumns } from "@/modules/savings-goals/hooks/useGoalTableColumns";

type Tab = "all" | "me" | "partner" | "shared";

type Member = { id: string; name: string };

type Props = {
  currentMemberId: string;
  dateFormat: DateFormat;
  goals: GoalCardData[];
  members: Member[];
  partnerName: null | string;
  realMemberId: string;
};

export function SavingsGoalsManager({ currentMemberId, dateFormat, goals, members, partnerName, realMemberId }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<null | SavingsGoalEditing>(null);
  const [contributionGoal, setContributionGoal] = useState<GoalCardData | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(goal: GoalCardData) {
    setEditing({
      description: goal.description ?? "",
      id: goal.id,
      image: goal.image,
      name: goal.name,
      ownerMemberId: goal.ownerMemberId,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ?? "",
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this savings goal? All its contribution history will be removed too.")) return;
    try {
      await deleteSavingsGoalAction(id);
      toast.success("Goal deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const filtered = useMemo(() => {
    if (tab === "all") return goals;
    return goals.filter((g) => roleForOwner(g.ownerMemberId, realMemberId) === tab);
  }, [goals, tab, realMemberId]);

  const columns = useGoalTableColumns(realMemberId, setContributionGoal, openEdit, handleDelete);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabSwitcher
          onValueChange={(v) => setTab(v as Tab)}
          tabs={[
            { label: "All Goals", value: "all" },
            { label: "Me", value: "me" },
            ...(partnerName ? [{ label: partnerName, value: "partner" }] : []),
            { label: "Shared", value: "shared" },
          ]}
          value={tab}
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              className="h-8 w-8"
              onClick={() => setView("grid")}
              size="icon"
              type="button"
              variant={view === "grid" ? "default" : "ghost"}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8"
              onClick={() => setView("list")}
              size="icon"
              type="button"
              variant={view === "list" ? "default" : "ghost"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {/* Sort isn't wired up yet — visual placeholder, matching the same
              pattern used for the disabled filters on other pages. */}
          <Button className="text-muted-foreground" disabled type="button" variant="outline">
            Sort by
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={openAdd} type="button">
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="space-y-3">
          {filtered.map((goal) => (
            <GoalCard
              dateFormat={dateFormat}
              goal={goal}
              key={goal.id}
              onAddContribution={setContributionGoal}
              onDelete={handleDelete}
              onEdit={openEdit}
              realMemberId={realMemberId}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} emptyMessage="No goals in this view." itemLabel="goals" rowKey={(g) => g.id} rows={filtered} />
      )}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 text-sm font-medium text-primary hover:bg-primary/5"
        onClick={openAdd}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Create New Savings Goal
      </button>

      <GoalForm
        currentMemberId={currentMemberId}
        editing={editing}
        key={editing?.id ?? "new"}
        members={members}
        onOpenChange={setFormOpen}
        open={formOpen}
      />

      <ContributionForm
        currentMemberId={currentMemberId}
        goalId={contributionGoal?.id ?? null}
        goalName={contributionGoal?.name ?? ""}
        key={contributionGoal?.id ?? "none"}
        members={members}
        onOpenChange={(open) => !open && setContributionGoal(null)}
        open={contributionGoal !== null}
      />
    </div>
  );
}
