CREATE TYPE "public"."notification_category" AS ENUM('budget', 'goal', 'payment', 'shared');--> statement-breakpoint
CREATE TYPE "public"."notification_severity" AS ENUM('danger', 'info', 'success', 'warning');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"category" "notification_category" NOT NULL,
	"severity" "notification_severity" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_household_id_dedupe_key_unique" UNIQUE("household_id","dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;