import { PiggyBank, WalletCards } from "lucide-react";

import { StatAmount } from "@/components/StatAmount";
import { type StatCard, StatCardGrid } from "@/components/StatCardGrid";
import { TONE_BAR_CLASSES } from "@/components/ToneIcon";
import { TrendLine } from "@/components/TrendLine";
import { formatNPR, pctOfIncome } from "@/modules/dashboard/lib/format";

type Props = {
  combinedIncome: number;
  expenseTrendPct: number | null;
  incomeTrendPct: number | null;
  monthlySavings: number;
  totalExpenses: number;
  unallocated: number;
};

function PctOfIncome({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  return <p className="mt-1 text-xs text-muted-foreground">{pct}% of income</p>;
}

export function SummaryCards({
  combinedIncome,
  totalExpenses,
  unallocated,
  incomeTrendPct,
  expenseTrendPct,
  monthlySavings,
}: Props) {
  const expensePct = pctOfIncome(totalExpenses, combinedIncome);
  const unallocatedPct = pctOfIncome(unallocated, combinedIncome);
  const savingsPct = pctOfIncome(monthlySavings, combinedIncome);

  const cards: StatCard[] = [
    {
      title: "Combined Income",
      icon: WalletCards,
      tone: "green",
      content: (
        <>
          <StatAmount>{formatNPR(combinedIncome)}</StatAmount>
          <p className="mt-1 text-xs text-muted-foreground">This month</p>
          <TrendLine pct={incomeTrendPct} />
        </>
      ),
    },
    {
      title: "Total Expenses",
      icon: WalletCards,
      tone: "pink",
      content: (
        <>
          <StatAmount>{formatNPR(totalExpenses)}</StatAmount>
          {expensePct !== null && (
            <>
              <PctOfIncome pct={expensePct} />
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${TONE_BAR_CLASSES.pink}`}
                  style={{ width: `${Math.min(expensePct, 100)}%` }}
                />
              </div>
            </>
          )}
          <TrendLine pct={expenseTrendPct} />
        </>
      ),
    },
    {
      title: "Total Savings",
      icon: PiggyBank,
      tone: "purple",
      content: (
        <>
          <StatAmount>{formatNPR(monthlySavings)}</StatAmount>
          <PctOfIncome pct={savingsPct} />
        </>
      ),
    },
    {
      title: "Unallocated",
      icon: WalletCards,
      tone: "orange",
      content: (
        <>
          <StatAmount>{formatNPR(unallocated)}</StatAmount>
          <PctOfIncome pct={unallocatedPct} />
        </>
      ),
    },
  ];

  return <StatCardGrid cards={cards} />;
}
