ALTER TABLE "equipment" ADD COLUMN "tier" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "tier" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_tier_check" CHECK ("equipment"."tier" >= 1);--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_tier_check" CHECK ("resources"."tier" >= 1);