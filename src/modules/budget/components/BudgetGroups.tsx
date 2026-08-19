"use client";

import { useState, useTransition } from "react";

import { Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setBudgetItemAction, setIncomeAction } from "@/modules/budget/api/budget.actions";
import { BudgetGroupTable } from "@/modules/budget/components/BudgetGroupTable";
import { BudgetItemRow } from "@/modules/budget/components/BudgetItemRow";
import { IncomeForm } from "@/modules/budget/components/IncomeForm";
import type { BudgetGroup } from "@/modules/budget/lib/budget-groups";

type Tab = "all" | BudgetGroup["key"];

type Props = {
  categories: { id: string; name: string }[];
  groups: BudgetGroup[];
  incomesByMember: Record<string, number>;
  itemsByCategory: Record<string, { ownerMemberId: null | string; plannedAmount: number }>;
  members: { id: string; name: string }[];
  month: number;
  year: number;
};

type ItemValue = { amount: string; owner: string };

const TAB_TRIGGER_CLASS =
  "rounded-none border-t-0 border-r-0 border-b-2 border-l-0 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

function initialIncomeValues(members: { id: string }[], incomesByMember: Record<string, number>) {
  return Object.fromEntries(members.map((m) => [m.id, String(incomesByMember[m.id] ?? "")]));
}

function initialItemValues(
  categories: { id: string }[],
  itemsByCategory: Record<string, { ownerMemberId: null | string; plannedAmount: number }>,
): Record<string, ItemValue> {
  return Object.fromEntries(
    categories.map((c) => {
      const existing = itemsByCategory[c.id];
      return [c.id, { amount: existing ? String(existing.plannedAmount) : "", owner: existing?.ownerMemberId ?? "shared" }];
    }),
  );
}

export function BudgetGroups({ categories, groups, incomesByMember, itemsByCategory, members, month, year }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [editing, setEditing] = useState(false);
  const [incomeValues, setIncomeValues] = useState(() => initialIncomeValues(members, incomesByMember));
  const [itemValues, setItemValues] = useState(() => initialItemValues(categories, itemsByCategory));
  const [pending, startTransition] = useTransition();

  const visibleGroups = tab === "all" ? groups : groups.filter((g) => g.key === tab);

  function handleSaveAll() {
    startTransition(async () => {
      try {
        await Promise.all([
          ...members.map((m) =>
            setIncomeAction({ amount: Number(incomeValues[m.id]) || 0, memberId: m.id, month, year }),
          ),
          ...categories.map((c) =>
            setBudgetItemAction({
              categoryId: c.id,
              month,
              ownerMemberId: itemValues[c.id]?.owner === "shared" ? null : (itemValues[c.id]?.owner ?? null),
              plannedAmount: Number(itemValues[c.id]?.amount) || 0,
              year,
            }),
          ),
        ]);
        toast.success("Budget saved");
        setEditing(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs onValueChange={(v) => setTab(v as Tab)} value={tab}>
          <TabsList className="justify-start gap-4 rounded-none border-b bg-transparent p-0">
            <TabsTrigger className={TAB_TRIGGER_CLASS} value="all">
              Overview
            </TabsTrigger>
            {groups.map((g) => (
              <TabsTrigger className={TAB_TRIGGER_CLASS} key={g.key} value={g.key}>
                {g.key === "me" ? "Me" : g.key === "shared" ? "Shared" : g.label.replace(" Budget", "")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={() => setEditing(true)} type="button">
          + Add Budget
        </Button>
      </div>

      <Dialog onOpenChange={setEditing} open={editing}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader icon={Wallet} tone="purple">
            <DialogTitle>Edit budget</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">Income</h3>
              <div className="space-y-3">
                {members.map((m) => (
                  <IncomeForm
                    key={m.id}
                    memberId={m.id}
                    memberName={m.name}
                    onChange={(value) => setIncomeValues((prev) => ({ ...prev, [m.id]: value }))}
                    value={incomeValues[m.id] ?? ""}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">Category allocations</h3>
              <div className="divide-y">
                {categories.map((c) => (
                  <BudgetItemRow
                    amount={itemValues[c.id]?.amount ?? ""}
                    categoryId={c.id}
                    categoryName={c.name}
                    key={c.id}
                    members={members}
                    onAmountChange={(value) =>
                      setItemValues((prev) => ({ ...prev, [c.id]: { ...prev[c.id], amount: value, owner: prev[c.id]?.owner ?? "shared" } }))
                    }
                    onOwnerChange={(value) =>
                      setItemValues((prev) => ({ ...prev, [c.id]: { ...prev[c.id], amount: prev[c.id]?.amount ?? "", owner: value } }))
                    }
                    owner={itemValues[c.id]?.owner ?? "shared"}
                  />
                ))}
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button disabled={pending} onClick={handleSaveAll} type="button">
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {visibleGroups.map((g) => (
          <BudgetGroupTable group={g} key={g.key} />
        ))}
      </div>
    </div>
  );
}
