import { z } from "zod";

export const loanSchema = z.object({
  counterpartyName: z.string().min(1),
  date: z.string(), // "YYYY-MM-DD"
  direction: z.enum(["given", "taken"]),
  dueDate: z.string().nullable(), // "YYYY-MM-DD"
  installmentAmount: z.number().positive().nullable(),
  installmentFrequency: z.enum(["weekly", "monthly"]).nullable(),
  nextInstallmentDate: z.string().nullable(), // "YYYY-MM-DD"
  note: z.string().optional(),
  ownerMemberId: z.string().uuid().nullable(),
  principalAmount: z.number().positive(),
});

export type LoanInput = z.infer<typeof loanSchema>;

export const loanPaymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string(), // "YYYY-MM-DD"
  memberId: z.string().uuid(),
  note: z.string().optional(),
});

export type LoanPaymentInput = z.infer<typeof loanPaymentSchema>;
