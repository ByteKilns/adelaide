import type { ReactNode } from "react";

import {
  ArrowDown,
  ArrowUp,
  type LucideIcon,
  PiggyBank,
  WalletCards,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type Tone,
  TONE_BAR_CLASSES,
  ToneIcon,
} from "@/modules/dashboard/components/ToneIcon";
import { formatNPR, pctOfIncome } from "@/modules/dashboard/lib/format";

type Props = {
  combinedIncome: number;
  expenseTrendPct: number | null;
  incomeTrendPct: number | null;
  totalExpenses: number;
  unallocated: number;
};

function TrendLine({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  const colorClass = pct >= 0 ? "text-green-600" : "text-red-600";
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}% vs last month
    </p>
  );
}

function Amount({ value }: { value: number }) {
  return <p className="text-lg font-semibold">{formatNPR(value)}</p>;
}

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
}: Props) {
  const expensePct = pctOfIncome(totalExpenses, combinedIncome);
  const unallocatedPct = pctOfIncome(unallocated, combinedIncome);

  const cards: {
    content: ReactNode;
    icon: LucideIcon;
    title: string;
    tone: Tone;
  }[] = [
    {
      title: "Combined Income",
      icon: WalletCards,
      tone: "green",
      content: (
        <>
          <Amount value={combinedIncome} />
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
          <Amount value={totalExpenses} />
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
      content: <p className="text-sm text-muted-foreground">Coming soon</p>,
    },
    {
      title: "Unallocated",
      icon: WalletCards,
      tone: "orange",
      content: (
        <>
          <Amount value={unallocated} />
          <PctOfIncome pct={unallocatedPct} />
        </>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {card.title}
            </CardTitle>
            <ToneIcon icon={card.icon} tone={card.tone} />
          </CardHeader>
          <CardContent>{card.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}
