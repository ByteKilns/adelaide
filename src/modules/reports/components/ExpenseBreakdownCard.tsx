"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { TONE_BAR_CLASSES, ToneIcon } from "@/components/ToneIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/modules/categories/lib/category-icons";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { CategorySlice } from "@/modules/reports/lib/reports-stats";

const TONE_HEX: Record<CategorySlice["tone"], string> = {
  amber: "#f59e0b",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
};

export function ExpenseBreakdownCard({ slices, total }: { slices: CategorySlice[]; total: number }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Expense Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">Where your money went this month</p>
        </div>
        <Link className="flex items-center gap-1 text-sm font-medium text-primary" href="/expenses">
          View full report
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-36 w-36 shrink-0">
          {slices.length > 0 && (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={slices} dataKey="amount" innerRadius="65%" nameKey="name" outerRadius="100%" paddingAngle={2}>
                  {slices.map((s) => (
                    <Cell fill={TONE_HEX[s.tone]} key={s.categoryId} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold">{formatNPR(total)}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {slices.length === 0 && <p className="text-sm text-muted-foreground">No expenses this month yet.</p>}
          {slices.map((s) => (
            <div className="flex items-center gap-3" key={s.categoryId}>
              <ToneIcon className="h-8 w-8" icon={getCategoryIcon(s.groupName)} tone={s.tone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{formatNPR(s.amount)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${TONE_BAR_CLASSES[s.tone]}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
              <span className="w-9 shrink-0 text-right text-sm text-muted-foreground">{s.pct}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
