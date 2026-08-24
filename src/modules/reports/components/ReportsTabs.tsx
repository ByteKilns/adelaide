"use client";

import { useState } from "react";

import { TabSwitcher } from "@/components/TabSwitcher";
import type { DateFormat } from "@/lib/date-format-cookie";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { ExpenseSummaryCard } from "@/modules/expenses/components/ExpenseSummaryCard";
import { ExpenseTable } from "@/modules/expenses/components/ExpenseTable";
import { TopCategoriesCard } from "@/modules/expenses/components/TopCategoriesCard";
import type { ExpenseRow } from "@/modules/expenses/hooks/useExpenseTableColumns";
import type { OwnerSlice, TopCategory } from "@/modules/expenses/lib/expense-breakdown";
import { ExpenseBreakdownCard } from "@/modules/reports/components/ExpenseBreakdownCard";
import { GoalSummaryRow } from "@/modules/reports/components/GoalSummaryRow";
import { IncomeBreakdownCard } from "@/modules/reports/components/IncomeBreakdownCard";
import { IncomeExpenseTrendCard } from "@/modules/reports/components/IncomeExpenseTrendCard";
import { SafeToSpendCard } from "@/modules/reports/components/SafeToSpendCard";
import { SmartInsightCard } from "@/modules/reports/components/SmartInsightCard";
import { TransactionsTable } from "@/modules/reports/components/TransactionsTable";
import type { CategorySlice, MonthPoint } from "@/modules/reports/lib/reports-stats";
import type { GoalCardData } from "@/modules/savings-goals/components/GoalCard";
import { GoalProgressOverviewCard } from "@/modules/savings-goals/components/GoalProgressOverviewCard";
import { type ContributionEntry, RecentContributionsCard } from "@/modules/savings-goals/components/RecentContributionsCard";
import { SavingsOverviewCard } from "@/modules/savings-goals/components/SavingsOverviewCard";
import type { GoalStatus } from "@/modules/savings-goals/lib/savings-stats";

type Tab = "expenses" | "income" | "overview" | "savings";

type Props = {
  combinedIncome: number;
  dateFormat: DateFormat;
  daysLeft: number;
  expenseRows: ExpenseRow[];
  expenseSlices: CategorySlice[];
  goals: GoalCardData[];
  goalStatusCounts: Record<GoalStatus, number>;
  incomeSlices: OwnerSlice[];
  insightMessage: string;
  monthLabel: string;
  ownerSlices: OwnerSlice[];
  partnerName: null | string;
  pctOfIncome: null | number;
  realMemberId: string;
  recentContributions: ContributionEntry[];
  safeToSpend: number;
  savingsAverageProgress: number;
  savingsMonthlyContribution: number;
  savingsPoints: { cumulative: number; label: string }[];
  savingsVsLastMonthPct: null | number;
  topCategories: (TopCategory & { groupName: string })[];
  totalExpenses: number;
  totalPlanned: number;
  trendPoints: MonthPoint[];
};

export function ReportsTabs(props: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-4">
      <TabSwitcher
        onValueChange={(v) => setTab(v as Tab)}
        tabs={[
          { label: "Overview", value: "overview" },
          { label: "Expenses", value: "expenses" },
          { label: "Income", value: "income" },
          { label: "Savings", value: "savings" },
        ]}
        value={tab}
      />

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <IncomeExpenseTrendCard combinedIncome={props.combinedIncome} points={props.trendPoints} totalExpenses={props.totalExpenses} />
            <ExpenseBreakdownCard slices={props.expenseSlices} total={props.totalExpenses} viewAllHref="/expenses" />
            <TransactionsTable dateFormat={props.dateFormat} realMemberId={props.realMemberId} rows={props.expenseRows} />
          </div>
          <div className="space-y-6">
            <ExpenseSummaryCard pctOfIncome={props.pctOfIncome} slices={props.ownerSlices} total={props.totalExpenses} />
            <TopCategoriesCard categories={props.topCategories} />
            <SafeToSpendCard
              daysLeft={props.daysLeft}
              monthLabel={props.monthLabel}
              safeToSpend={props.safeToSpend}
              totalActual={props.totalExpenses}
              totalPlanned={props.totalPlanned}
            />
            <SmartInsightCard message={props.insightMessage} />
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ExpenseTable
              dateFormat={props.dateFormat}
              partnerName={props.partnerName}
              realMemberId={props.realMemberId}
              rows={props.expenseRows}
            />
          </div>
          <div className="space-y-6">
            <ExpenseBreakdownCard slices={props.expenseSlices} total={props.totalExpenses} viewAllHref="/expenses" />
            <TopCategoriesCard categories={props.topCategories} />
          </div>
        </div>
      )}

      {tab === "income" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <IncomeExpenseTrendCard combinedIncome={props.combinedIncome} points={props.trendPoints} totalExpenses={props.totalExpenses} />
          </div>
          <div className="space-y-6">
            <IncomeBreakdownCard slices={props.incomeSlices} total={props.combinedIncome} />
            <p className="text-sm text-muted-foreground">
              Total income this month: <span className="font-medium text-foreground">{formatNPR(props.combinedIncome)}</span>.
              Manage income amounts from the Budget page.
            </p>
          </div>
        </div>
      )}

      {tab === "savings" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {props.goals.length === 0 && <p className="text-sm text-muted-foreground">No savings goals yet.</p>}
            {props.goals.map((goal) => (
              <GoalSummaryRow goal={goal} key={goal.id} realMemberId={props.realMemberId} />
            ))}
          </div>
          <div className="space-y-6">
            <SavingsOverviewCard
              monthlyContribution={props.savingsMonthlyContribution}
              points={props.savingsPoints}
              vsLastMonthPct={props.savingsVsLastMonthPct}
            />
            <GoalProgressOverviewCard averageProgress={props.savingsAverageProgress} counts={props.goalStatusCounts} />
            <RecentContributionsCard dateFormat={props.dateFormat} items={props.recentContributions} />
          </div>
        </div>
      )}
    </div>
  );
}
