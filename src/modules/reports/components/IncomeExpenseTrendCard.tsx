"use client";

import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { MonthPoint } from "@/modules/reports/lib/reports-stats";

type Props = {
  className?: string;
  combinedIncome: number;
  points: MonthPoint[];
  totalExpenses: number;
};

export function IncomeExpenseTrendCard({ className, combinedIncome, points, totalExpenses }: Props) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Spending Overview</CardTitle>
        <p className="text-sm text-muted-foreground">Your expenses compared to income, last 6 months</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Income <span className="font-semibold">{formatNPR(combinedIncome)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            Expenses <span className="font-semibold">{formatNPR(totalExpenses)}</span>
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={points} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
              <XAxis axisLine={false} dataKey="label" fontSize={11} tickLine={false} />
              <Tooltip formatter={(value) => formatNPR(Number(value))} />
              <Legend />
              <Line dataKey="income" dot={{ r: 3 }} name="Income" stroke="#22c55e" strokeWidth={2} type="monotone" />
              <Line dataKey="expenses" dot={{ r: 3 }} name="Expenses" stroke="#ec4899" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
