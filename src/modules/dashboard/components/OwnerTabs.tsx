"use client";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

import { StatAmount } from "@/components/StatAmount";
import { TabSwitcher } from "@/components/TabSwitcher";
import { ToneIcon } from "@/components/ToneIcon";
import { TrendLine } from "@/components/TrendLine";
import { TabsContent } from "@/components/ui/tabs";
import { formatNPR, pctOfIncome } from "@/modules/dashboard/lib/format";

type OwnerView = {
  expenses: number;
  expenseTrendPct: null | number;
  income: number;
  incomeTrendPct: null | number;
  key: string;
  label: string;
  remaining: number;
};

export function OwnerTabs({ views }: { views: OwnerView[] }) {
  return (
    <TabSwitcher className="w-full" defaultValue={views[0]?.key} tabs={views.map((v) => ({ label: v.label, value: v.key }))}>
      {views.map((v) => {
        const percent = pctOfIncome(v.expenses, v.income) ?? 0;
        const remainingPercent = Math.max(0, 100 - percent);

        return (
          <TabsContent className="space-y-4 pt-4" key={v.key} value={v.key}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <ToneIcon icon={ArrowDownLeft} tone="green" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <StatAmount>{formatNPR(v.income)}</StatAmount>
                  <TrendLine pct={v.incomeTrendPct} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ToneIcon icon={ArrowUpRight} tone="pink" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <StatAmount>{formatNPR(v.expenses)}</StatAmount>
                  <p className="mt-1 text-xs text-muted-foreground">{percent}% of income</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ToneIcon icon={CheckCircle2} tone="blue" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <StatAmount>{formatNPR(v.remaining)}</StatAmount>
                  <p className="mt-1 text-xs text-muted-foreground">{remainingPercent}% available</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Income used</span>
                <span className="font-medium">{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${percent > 100 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min(Math.max(percent, 3), 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {v.expenses === 0
                  ? "No expenses recorded yet. You're fully on track."
                  : percent > 100
                    ? "You've gone over your available income this month."
                    : "Your spending is within the monthly plan."}
              </p>
            </div>
          </TabsContent>
        );
      })}
    </TabSwitcher>
  );
}
