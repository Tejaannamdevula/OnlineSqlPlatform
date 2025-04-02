ALTER TABLE "contest_leaderboard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contest_registrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_problems" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "contest_leaderboard" CASCADE;--> statement-breakpoint
DROP TABLE "contest_registrations" CASCADE;--> statement-breakpoint
DROP TABLE "user_problems" CASCADE;--> statement-breakpoint
ALTER TABLE "contest_points" DROP CONSTRAINT "contest_points_problem_id_problems_id_fk";
--> statement-breakpoint
ALTER TABLE "contest_points" DROP CONSTRAINT "contest_points_contest_id_user_id_problem_id_pk";--> statement-breakpoint
ALTER TABLE "contest_points" ADD CONSTRAINT "contest_points_contest_id_user_id_pk" PRIMARY KEY("contest_id","user_id");--> statement-breakpoint
ALTER TABLE "contest_problems" ADD COLUMN "solved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "contest_submissions" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "protected_contest" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "contest_points" DROP COLUMN "problem_id";--> statement-breakpoint
ALTER TABLE "contest_submissions" DROP COLUMN "is_correct";--> statement-breakpoint
ALTER TABLE "contest_submissions" DROP COLUMN "attempt_number";--> statement-breakpoint
ALTER TABLE "contests" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "contests" DROP COLUMN "registration_required";--> statement-breakpoint
ALTER TABLE "contests" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "contests" DROP COLUMN "rules";--> statement-breakpoint
ALTER TABLE "contests" DROP COLUMN "time_limit";