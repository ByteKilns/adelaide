import { z } from "zod";

export const savingsGoalSchema = z.object({
  description: z.string().optional(),
  image: z.string().nullable(),
  name: z.string().min(1),
  ownerMemberId: z.string().uuid().nullable(),
  targetAmount: z.number().positive().nullable(),
  targetDate: z.string().nullable(), // "YYYY-MM-DD"
});

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;

export const contributionSchema = z.object({
  amount: z.number().positive(),
  date: z.string(), // "YYYY-MM-DD"
  memberId: z.string().uuid(),
});

export type ContributionInput = z.infer<typeof contributionSchema>;
