import { z } from "zod";

export const setIncomeSchema = z.object({
  memberId: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative(),
  note: z.string().optional(),
});

export type SetIncomeInput = z.infer<typeof setIncomeSchema>;
