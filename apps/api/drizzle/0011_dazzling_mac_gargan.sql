ALTER TABLE "actions" ADD COLUMN "delaySeconds" double precision DEFAULT 0.5 NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "cycleMs" integer DEFAULT 8000 NOT NULL;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_delaySeconds_check" CHECK ("actions"."delaySeconds" >= 0);--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_cycleMs_check" CHECK ("task"."cycleMs" > 0);