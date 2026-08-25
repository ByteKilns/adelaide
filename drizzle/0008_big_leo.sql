CREATE TYPE "public"."dhuku_entry_type" AS ENUM('contribution', 'payout');--> statement-breakpoint
CREATE TABLE "dhuku_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dhuku_id" uuid NOT NULL,
	"type" "dhuku_entry_type" NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dhukus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"owner_member_id" uuid,
	"name" text NOT NULL,
	"total_members" integer NOT NULL,
	"monthly_contribution" numeric(12, 2) NOT NULL,
	"interest_per_month" numeric(12, 2),
	"start_date" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dhuku_entries" ADD CONSTRAINT "dhuku_entries_dhuku_id_dhukus_id_fk" FOREIGN KEY ("dhuku_id") REFERENCES "public"."dhukus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dhukus" ADD CONSTRAINT "dhukus_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dhukus" ADD CONSTRAINT "dhukus_owner_member_id_household_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;