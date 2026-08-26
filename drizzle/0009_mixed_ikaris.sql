CREATE TYPE "public"."date_format" AS ENUM('nepali', 'english');--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "date_format" date_format DEFAULT 'nepali' NOT NULL;