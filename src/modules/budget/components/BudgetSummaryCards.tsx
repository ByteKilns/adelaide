import { PiggyBank, Target, Wallet, WalletCards } from "lucide-react";

import { StatAmount } from "@/components/StatAmount";
import { type StatCard, StatCardGrid } from "@/components/StatCardGrid";
import { formatNPR, pctOfIncome } from "@/modules/dashboard/lib/format";

type Props = {
  allocated: number;
  combinedIncome: number;
  totalBudget: number;
  unallocated: number;
};

function ProgressLine({ pct }: { pct: null | number }) {
  if (pct === null) return null;
  return (
    <>
      <p className="mt-1 text-xs text-muted-foreground">{pct}% of income</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </>
  );
}

export function BudgetSummaryCards({ allocated, combinedIncome, totalBudget, unallocated }: Props) {
  const cards: StatCard[] = [
    {
      content: (
        <>
          <StatAmount>{formatNPR(combinedIncome)}</StatAmount>
          <p className="mt-1 text-xs text-muted-foreground">This month</p>
        </>
      ),
      icon: WalletCards,
      title: "Combined Income",
      tone: "green",
    },
    {
      content: (
        <>
          <StatAmount>{formatNPR(totalBudget)}</StatAmount>
          <ProgressLine pct={pctOfIncome(totalBudget, combinedIncome)} />
        </>
      ),
      icon: Wallet,
      title: "Total Budget",
      tone: "purple",
    },
    {
      content: (
        <>
          <StatAmount>{formatNPR(allocated)}</StatAmount>
          <ProgressLine pct={pctOfIncome(allocated, combinedIncome)} />
        </>
      ),
      icon: Target,
      title: "Allocated",
      tone: "blue",
    },
    {
      content: (
        <>
          <StatAmount>{formatNPR(unallocated)}</StatAmount>
          <p className="mt-1 text-xs text-muted-foreground">
            {pctOfIncome(unallocated, combinedIncome) ?? 0}% of income
          </p>
        </>
      ),
      icon: PiggyBank,
      title: "Unbudgeted",
      tone: "amber",
    },
  ];

  return <StatCardGrid cards={cards} />;
}
