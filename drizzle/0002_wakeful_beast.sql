ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "sessions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "attendances" integer DEFAULT 0 NOT NULL;
