export type LoanDirection = "given" | "taken";
export type LoanInstallmentFrequency = "monthly" | "weekly";
export type LoanStatus = "active" | "settled";

export type LoanRow = {
  counterpartyName: string;
  date: string;
  direction: LoanDirection;
  dueDate: null | string;
  id: string;
  installmentAmount: null | string;
  installmentFrequency: LoanInstallmentFrequency | null;
  nextInstallmentDate: null | string;
  note: null | string;
  ownerMemberId: null | string;
  principalAmount: string;
};

export type PaymentTotal = { amount: number; loanId: string };

export type LoanCardData = {
  counterpartyName: string;
  date: string;
  direction: LoanDirection;
  dueDate: null | string;
  id: string;
  installmentAmount: null | number;
  installmentFrequency: LoanInstallmentFrequency | null;
  nextInstallmentDate: null | string;
  note: null | string;
  outstanding: number;
  ownerMemberId: null | string;
  ownerName: null | string;
  paid: number;
  pct: number;
  principalAmount: number;
  status: LoanStatus;
};

export function paidAmountForLoan(loanId: string, payments: PaymentTotal[]): number {
  return payments.filter((p) => p.loanId === loanId).reduce((s, p) => s + p.amount, 0);
}

// Shared shaping from raw rows -> view model, same pattern as
// buildGoalCards in savings-stats.ts.
export function buildLoanCards(
  loanRows: LoanRow[],
  payments: PaymentTotal[],
  memberById: Map<string, { user: { name: string } }>,
): LoanCardData[] {
  return loanRows.map((l) => {
    const principalAmount = Number(l.principalAmount);
    const paid = paidAmountForLoan(l.id, payments);
    const outstanding = Math.max(0, principalAmount - paid);
    const owner = l.ownerMemberId ? memberById.get(l.ownerMemberId) : null;
    return {
      counterpartyName: l.counterpartyName,
      date: l.date,
      direction: l.direction,
      dueDate: l.dueDate,
      id: l.id,
      installmentAmount: l.installmentAmount === null ? null : Number(l.installmentAmount),
      installmentFrequency: l.installmentFrequency,
      nextInstallmentDate: l.nextInstallmentDate,
      note: l.note,
      outstanding,
      ownerMemberId: l.ownerMemberId,
      ownerName: owner?.user.name ?? null,
      paid,
      pct: principalAmount > 0 ? Math.round((Math.min(paid, principalAmount) / principalAmount) * 100) : 0,
      principalAmount,
      status: outstanding <= 0 ? "settled" : "active",
    };
  });
}

export type LoanOverviewStats = {
  outstandingToPay: number;
  outstandingToReceive: number;
  totalActive: number;
  totalGiven: number;
  totalTaken: number;
};

export function loanOverviewStats(loans: LoanCardData[]): LoanOverviewStats {
  const given = loans.filter((l) => l.direction === "given");
  const taken = loans.filter((l) => l.direction === "taken");
  return {
    outstandingToPay: taken.reduce((s, l) => s + l.outstanding, 0),
    outstandingToReceive: given.reduce((s, l) => s + l.outstanding, 0),
    totalActive: loans.filter((l) => l.status === "active").length,
    totalGiven: given.reduce((s, l) => s + l.principalAmount, 0),
    totalTaken: taken.reduce((s, l) => s + l.principalAmount, 0),
  };
}
