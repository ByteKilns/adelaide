import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  ownerMemberId: z.string().uuid().nullable(),
  paidByMemberId: z.string().uuid(),
  date: z.string(), // "YYYY-MM-DD"
  note: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
