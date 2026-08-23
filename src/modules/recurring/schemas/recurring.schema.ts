import { z } from "zod";

import { RECURRING_ICONS } from "@/modules/recurring/lib/recurring-icons";

export const recurringExpenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  frequency: z.enum(["monthly", "yearly"]),
  icon: z.enum(RECURRING_ICONS),
  name: z.string().min(1),
  nextDueDate: z.string(), // "YYYY-MM-DD"
  ownerMemberId: z.string().uuid().nullable(),
  vendor: z.string().optional(),
});

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;
