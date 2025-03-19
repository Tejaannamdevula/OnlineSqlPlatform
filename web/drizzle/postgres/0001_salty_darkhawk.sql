ALTER TABLE "contests" ADD COLUMN "registration_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "password" varchar(255);--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "rules" text;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "time_limit" integer;