"use client";

import { TabSwitcher } from "@/components/TabSwitcher";
import { TabsContent } from "@/components/ui/tabs";
import type { DateFormat } from "@/lib/date-format-cookie";
import { ExpenseSummaryTabs } from "@/modules/expenses/components/ExpenseSummaryTabs";
import { ExpenseTable } from "@/modules/expenses/components/ExpenseTable";
import type { ExpenseRow } from "@/modules/expenses/hooks/useExpenseTableColumns";
import type { OwnerSlice } from "@/modules/expenses/lib/expense-breakdown";
import { IncomeExpenseTrendCard } from "@/modules/reports/components/IncomeExpenseTrendCard";
import { SpendingPaceCard } from "@/modules/reports/components/SpendingPaceCard";
import type {
  CategorySlice,
  MonthPoint,
  PacePoint,
} from "@/modules/reports/lib/reports-stats";

type Props = {
  categorySlices: CategorySlice[];
  combinedIncome: number;
  dateFormat: DateFormat;
  ownerSlices: OwnerSlice[];
  pacePoints: PacePoint[];
  partnerName: string | null;
  pctOfIncome: null | number;
  realMemberId: string;
  rows: ExpenseRow[];
  totalExpenses: number;
  totalPlanned: number;
  trendPoints: MonthPoint[];
};

export function ExpensesPageTabs({
  categorySlices,
  combinedIncome,
  dateFormat,
  ownerSlices,
  pacePoints,
  partnerName,
  pctOfIncome,
  realMemberId,
  rows,
  totalExpenses,
  totalPlanned,
  trendPoints,
}: Props) {
  return (
    <TabSwitcher
      defaultValue="expenses"
      tabs={[
        { label: "Expenses", value: "expenses" },
        { label: "Overview", value: "charts" },
      ]}
    >
      <TabsContent className="pt-4" value="expenses">
        <ExpenseTable
          dateFormat={dateFormat}
          partnerName={partnerName}
          realMemberId={realMemberId}
          rows={rows}
        />
      </TabsContent>
      <TabsContent className="pt-4" value="charts">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SpendingPaceCard points={pacePoints} totalPlanned={totalPlanned} />
          <IncomeExpenseTrendCard
            className="lg:col-span-2"
            combinedIncome={combinedIncome}
            points={trendPoints}
            totalExpenses={totalExpenses}
          />
          <ExpenseSummaryTabs
            categorySlices={categorySlices}
            ownerSlices={ownerSlices}
            pctOfIncome={pctOfIncome}
            total={totalExpenses}
          />
        </div>
      </TabsContent>
    </TabSwitcher>
  );
}
