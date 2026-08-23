"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { OwnerSlice } from "@/modules/expenses/lib/expense-breakdown";

const TONE_HEX: Record<OwnerSlice["tone"], string> = {
  amber: "#f59e0b",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
};

export function IncomeBreakdownCard({ slices, total }: { slices: OwnerSlice[]; total: number }) {
  const chartData = slices.filter((s) => s.amount > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Income by Member</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0">
          {chartData.length > 0 && (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={chartData} dataKey="amount" innerRadius="65%" nameKey="label" outerRadius="100%" paddingAngle={2}>
                  {chartData.map((s) => (
                    <Cell fill={TONE_HEX[s.tone]} key={s.key} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold">{formatNPR(total)}</p>
          </div>
        </div>

        <ul className="flex-1 space-y-2 text-sm">
          {slices.map((s) => (
            <li className="flex items-center justify-between" key={s.key}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TONE_HEX[s.tone] }} />
                {s.label}
              </span>
              <span className="text-muted-foreground">
                {formatNPR(s.amount)} ({total > 0 ? Math.round((s.amount / total) * 100) : 0}%)
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
