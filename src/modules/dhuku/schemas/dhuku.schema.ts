// src/modules/dhuku/schemas/dhuku.schema.ts
import { z } from "zod";

export const dhukuSchema = z.object({
  // Optional and always visible in the form (no explicit toggle) — an
  // empty number input becomes NaN via RHF's valueAsNumber, so normalize
  // that to null before the nullable() check runs, rather than making the
  // form paper over it after the fact.
  interestPerMonth: z.preprocess(
    (v) => (typeof v === "number" && Number.isNaN(v) ? null : v),
    z.number().positive().nullable(),
  ),
  monthlyContribution: z.number().positive(),
  name: z.string().min(1),
  note: z.string().optional(),
  ownerMemberId: z.string().uuid().nullable(),
  startDate: z.string(), // "YYYY-MM-DD"
  totalMembers: z.number().int().min(2),
});

export type DhukuInput = z.infer<typeof dhukuSchema>;

export const dhukuEntrySchema = z.object({
  amount: z.number().positive(),
  date: z.string(), // "YYYY-MM-DD"
  note: z.string().optional(),
  type: z.enum(["contribution", "payout"]),
});

export type DhukuEntryInput = z.infer<typeof dhukuEntrySchema>;
