CREATE TYPE "public"."loan_installment_frequency" AS ENUM('weekly', 'monthly');--> statement-breakpoint
ALTER TABLE "savings_goals" ALTER COLUMN "target_amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "installment_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "installment_frequency" "loan_installment_frequency";--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "next_installment_date" date;