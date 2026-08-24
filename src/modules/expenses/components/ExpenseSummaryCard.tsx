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

type ContentProps = {
  pctOfIncome: null | number;
  slices: OwnerSlice[];
  total: number;
};

export function ExpenseSummaryContent({ pctOfIncome, slices, total }: ContentProps) {
  const chartData = slices.filter((s) => s.amount > 0);

  return (
    <>
      <p className="text-xs text-muted-foreground">Total Expenses</p>
      <div className="flex items-center gap-2">
        <p className="text-xl font-semibold">{formatNPR(total)}</p>
        {pctOfIncome !== null && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            {pctOfIncome}% of income
          </span>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="mx-auto mt-4 h-40 w-40">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                innerRadius="65%"
                nameKey="label"
                outerRadius="100%"
                paddingAngle={2}
              >
                {chartData.map((s) => (
                  <Cell fill={TONE_HEX[s.tone]} key={s.key} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <ul className="mt-4 space-y-2 text-sm">
        {slices.map((s) => (
          <li className="flex items-center justify-between" key={s.key}>
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: TONE_HEX[s.tone] }}
              />
              {s.label}
            </span>
            <span className="text-muted-foreground">{formatNPR(s.amount)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

type Props = {
  pctOfIncome: null | number;
  slices: OwnerSlice[];
  total: number;
};

export function ExpenseSummaryCard({ pctOfIncome, slices, total }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ExpenseSummaryContent pctOfIncome={pctOfIncome} slices={slices} total={total} />
      </CardContent>
    </Card>
  );
}
