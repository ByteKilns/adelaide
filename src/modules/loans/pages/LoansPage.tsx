import { ArrowDownLeft, ArrowUpRight, HandCoins, Wallet } from "lucide-react";

import { StatAmount } from "@/components/StatAmount";
import { StatCardGrid } from "@/components/StatCardGrid";
import { getDateFormatPref } from "@/lib/date-format-cookie";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { listLoanPayments, listLoans } from "@/modules/loans/api/loans.actions";
import { LoansHeader } from "@/modules/loans/components/LoansHeader";
import { LoansManager } from "@/modules/loans/components/LoansManager";
import { buildLoanCards, loanOverviewStats } from "@/modules/loans/lib/loan-stats";

export async function LoansPage() {
  const { householdId, memberId } = await getCurrentMember();

  const [members, loanRows, paymentRows, dateFormat] = await Promise.all([
    getHouseholdMembers(householdId),
    listLoans(householdId),
    listLoanPayments(householdId),
    getDateFormatPref(),
  ]);

  const memberById = new Map(members.map((m) => [m.id, m]));
  const payments = paymentRows.map((p) => ({ amount: Number(p.amount), loanId: p.loanId }));
  const loans = buildLoanCards(loanRows, payments, memberById);
  const stats = loanOverviewStats(loans);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <LoansHeader />

      <StatCardGrid
        cards={[
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.totalGiven)}</StatAmount>
                <p className="text-xs text-muted-foreground">Total principal lent</p>
              </div>
            ),
            icon: HandCoins,
            title: "Lent Out",
            tone: "blue",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.totalTaken)}</StatAmount>
                <p className="text-xs text-muted-foreground">Total principal borrowed</p>
              </div>
            ),
            icon: Wallet,
            title: "Borrowed",
            tone: "amber",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.outstandingToReceive)}</StatAmount>
                <p className="text-xs text-muted-foreground">Still owed to you</p>
              </div>
            ),
            icon: ArrowDownLeft,
            title: "Owed to You",
            tone: "green",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.outstandingToPay)}</StatAmount>
                <p className="text-xs text-muted-foreground">Still owed by you</p>
              </div>
            ),
            icon: ArrowUpRight,
            title: "You Owe",
            tone: "pink",
          },
        ]}
      />

      <LoansManager
        currentMemberId={memberId}
        dateFormat={dateFormat}
        loans={loans}
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
        realMemberId={memberId}
      />
    </div>
  );
}
