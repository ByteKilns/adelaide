import type { ReactNode } from "react";

import { PiggyBank, Target, Wallet, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Tone, ToneIcon } from "@/modules/dashboard/components/ToneIcon";
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
  const cards: { content: ReactNode; icon: typeof WalletCards; title: string; tone: Tone }[] = [
    {
      content: (
        <>
          <p className="text-xl font-semibold">{formatNPR(combinedIncome)}</p>
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
          <p className="text-xl font-semibold">{formatNPR(totalBudget)}</p>
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
          <p className="text-xl font-semibold">{formatNPR(allocated)}</p>
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
          <p className="text-xl font-semibold">{formatNPR(unallocated)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pctOfIncome(unallocated, combinedIncome) ?? 0}% of income
          </p>
        </>
      ),
      icon: PiggyBank,
      title: "Unallocated",
      tone: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">{card.title}</CardTitle>
            <ToneIcon icon={card.icon} tone={card.tone} />
          </CardHeader>
          <CardContent>{card.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}
