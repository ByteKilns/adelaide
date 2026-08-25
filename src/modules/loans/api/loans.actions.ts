"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { loanPayments, loans } from "@/db/schema";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { type LoanInput, type LoanPaymentInput, loanPaymentSchema, loanSchema } from "@/modules/loans/schemas/loan.schema";
import { insertNotification } from "@/modules/notifications/api/notifications.actions";

function revalidateLoansPaths() {
  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

async function assertMemberInHousehold(householdId: string, memberId: string) {
  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === memberId)) {
    throw new Error("Member does not belong to this household");
  }
}

export async function listLoans(householdId: string) {
  return db.select().from(loans).where(eq(loans.householdId, householdId)).orderBy(desc(loans.date));
}

export async function listLoanPayments(householdId: string) {
  const rows = await listLoans(householdId);
  const loanIds = rows.map((l) => l.id);
  if (loanIds.length === 0) return [];

  return db
    .select()
    .from(loanPayments)
    .where(inArray(loanPayments.loanId, loanIds))
    .orderBy(desc(loanPayments.date), desc(loanPayments.createdAt));
}

export async function createLoanAction(input: LoanInput) {
  const { householdId } = await getCurrentMember();
  const parsed = loanSchema.parse(input);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db.insert(loans).values({
    counterpartyName: parsed.counterpartyName,
    date: parsed.date,
    direction: parsed.direction,
    dueDate: parsed.dueDate,
    householdId,
    installmentAmount: parsed.installmentAmount === null ? null : String(parsed.installmentAmount),
    installmentFrequency: parsed.installmentFrequency,
    nextInstallmentDate: parsed.nextInstallmentDate,
    note: parsed.note?.trim() || null,
    ownerMemberId: parsed.ownerMemberId,
    principalAmount: String(parsed.principalAmount),
  });

  revalidateLoansPaths();
}

export async function updateLoanAction(id: string, input: LoanInput) {
  const { householdId } = await getCurrentMember();
  const parsed = loanSchema.parse(input);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db
    .update(loans)
    .set({
      counterpartyName: parsed.counterpartyName,
      date: parsed.date,
      direction: parsed.direction,
      dueDate: parsed.dueDate,
      installmentAmount: parsed.installmentAmount === null ? null : String(parsed.installmentAmount),
      installmentFrequency: parsed.installmentFrequency,
      nextInstallmentDate: parsed.nextInstallmentDate,
      note: parsed.note?.trim() || null,
      ownerMemberId: parsed.ownerMemberId,
      principalAmount: String(parsed.principalAmount),
    })
    .where(and(eq(loans.id, id), eq(loans.householdId, householdId)));

  revalidateLoansPaths();
}

export async function deleteLoanAction(id: string) {
  const { householdId } = await getCurrentMember();
  await db.delete(loans).where(and(eq(loans.id, id), eq(loans.householdId, householdId)));

  revalidateLoansPaths();
}

async function getLoanInHousehold(householdId: string, loanId: string) {
  const [loan] = await db.select().from(loans).where(and(eq(loans.id, loanId), eq(loans.householdId, householdId)));
  if (!loan) {
    throw new Error("Loan does not belong to this household");
  }
  return loan;
}

function advanceInstallmentDate(dateStr: string, frequency: "monthly" | "weekly"): string {
  const next = new Date(`${dateStr}T00:00:00`);
  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setDate(next.getDate() + 7);
  }
  return next.toISOString().slice(0, 10);
}

export async function addLoanPaymentAction(loanId: string, input: LoanPaymentInput) {
  const { householdId, name: actorName } = await getCurrentMember();
  const parsed = loanPaymentSchema.parse(input);
  const loan = await getLoanInHousehold(householdId, loanId);
  await assertMemberInHousehold(householdId, parsed.memberId);

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(loanPayments)
      .values({
        amount: String(parsed.amount),
        date: parsed.date,
        loanId,
        memberId: parsed.memberId,
        note: parsed.note?.trim() || null,
      })
      .returning();

    // Roll the next installment forward by one cycle, unless this payment
    // has now settled the loan — same "one cycle at a time" behavior as
    // markRecurringExpensePaidAction's nextDueDate advance.
    if (loan.installmentFrequency && loan.nextInstallmentDate) {
      const paidRows = await tx.select().from(loanPayments).where(eq(loanPayments.loanId, loanId));
      const totalPaid = paidRows.reduce((s, p) => s + Number(p.amount), 0);
      const outstanding = Number(loan.principalAmount) - totalPaid;
      if (outstanding > 0) {
        const nextInstallmentDate = advanceInstallmentDate(loan.nextInstallmentDate, loan.installmentFrequency);
        await tx.update(loans).set({ nextInstallmentDate }).where(eq(loans.id, loanId));
      }
    }

    return row;
  });

  const verb = loan.direction === "given" ? "received from" : "paid to";
  // Reuses the existing "shared" notification category/preference rather
  // than adding a new "loan" enum value + preferences toggle for what is
  // still just a single household-activity event type.
  await insertNotification({
    body: `${actorName} recorded ${formatNPR(parsed.amount)} ${verb} ${loan.counterpartyName}.`,
    category: "shared",
    dedupeKey: `loan-payment:${created.id}`,
    householdId,
    severity: "success",
    title: "Loan payment recorded",
  });

  revalidateLoansPaths();
}

export async function deleteLoanPaymentAction(id: string) {
  const { householdId } = await getCurrentMember();
  const [payment] = await db.select().from(loanPayments).where(eq(loanPayments.id, id));
  if (!payment) return;
  await getLoanInHousehold(householdId, payment.loanId);

  await db.delete(loanPayments).where(eq(loanPayments.id, id));

  revalidateLoansPaths();
}
