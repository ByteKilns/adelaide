"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetGroup } from "@/modules/budget/lib/budget-groups";
import { formatNPR } from "@/modules/dashboard/lib/format";

const TONE_HEX: Record<BudgetGroup["tone"], string> = {
  amber: "#f59e0b",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
};

export function AllocationSummaryCard({ groups }: { groups: BudgetGroup[] }) {
  const total = groups.reduce((s, g) => s + g.totalPlanned, 0);
  const chartData = groups.filter((g) => g.totalPlanned > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Allocation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 && (
          <div className="relative mx-auto h-40 w-40">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={chartData} dataKey="totalPlanned" innerRadius="65%" nameKey="label" outerRadius="100%" paddingAngle={2}>
                  {chartData.map((g) => (
                    <Cell fill={TONE_HEX[g.tone]} key={g.key} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-lg font-semibold">{formatNPR(total)}</p>
              <p className="text-xs text-muted-foreground">Allocated</p>
            </div>
          </div>
        )}

        <ul className="mt-4 space-y-2 text-sm">
          {groups.map((g) => (
            <li className="flex items-center justify-between" key={g.key}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TONE_HEX[g.tone] }} />
                {g.label}
              </span>
              <span className="text-muted-foreground">
                {formatNPR(g.totalPlanned)} ({total > 0 ? Math.round((g.totalPlanned / total) * 100) : 0}%)
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
