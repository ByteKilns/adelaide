"use client";

import { useState } from "react";

import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const TAB_TRIGGER_CLASS =
  "rounded-none border-t-0 border-r-0 border-b-2 border-l-0 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export function BudgetGroups({ categories, groups, incomesByMember, itemsByCategory, members, month, year }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [editing, setEditing] = useState(false);

  const visibleGroups = tab === "all" ? groups : groups.filter((g) => g.key === tab);

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
                    initialAmount={incomesByMember[m.id] ?? 0}
                    key={m.id}
                    memberId={m.id}
                    memberName={m.name}
                    month={month}
                    year={year}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">Category allocations</h3>
              <div className="divide-y">
                {categories.map((c) => {
                  const existing = itemsByCategory[c.id];
                  return (
                    <BudgetItemRow
                      categoryId={c.id}
                      categoryName={c.name}
                      initialOwnerMemberId={existing?.ownerMemberId ?? null}
                      initialPlannedAmount={existing?.plannedAmount ?? 0}
                      key={c.id}
                      members={members}
                      month={month}
                      year={year}
                    />
                  );
                })}
              </div>
            </section>
          </div>
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
