import { WalletCards } from "lucide-react";

import { ToneIcon } from "@/components/ToneIcon";
import { Card, CardContent } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";

type Props = {
  daysLeft: number;
  monthLabel: string;
  safeToSpend: number;
  totalActual: number;
  totalPlanned: number;
};

export function SafeToSpendCard({ daysLeft, monthLabel, safeToSpend, totalActual, totalPlanned }: Props) {
  const monthName = monthLabel.split(" ")[0];
  const remaining = totalPlanned - totalActual;
  const noBudget = totalPlanned <= 0;
  const onTrack = !noBudget && remaining >= 0;

  const status = noBudget ? "No budget set" : onTrack ? "On track" : "Over budget";
  const dotClass = noBudget ? "bg-muted-foreground" : onTrack ? "bg-green-500" : "bg-destructive";
  const textClass = noBudget ? "text-muted-foreground" : onTrack ? "text-green-600" : "text-destructive";

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <ToneIcon icon={WalletCards} tone="purple" />
            <div>
              <h2 className="text-sm font-semibold">Safe to spend today</h2>
              <p className="text-xs text-muted-foreground">
                {daysLeft} day{daysLeft === 1 ? "" : "s"} left in {monthName}
              </p>
            </div>
          </div>
          <button
            aria-label="Learn how safe to spend is calculated"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground hover:bg-accent"
            title="(Remaining budget for the month) ÷ (days left), never below NPR 0."
            type="button"
          >
            ?
          </button>
        </div>

        <p className="text-2xl font-extrabold">{formatNPR(safeToSpend)}</p>

        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {status}
        </span>
      </CardContent>
    </Card>
  );
}
