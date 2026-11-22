ALTER TABLE "resourceGatheringGroup" ADD COLUMN "name" text;--> statement-breakpoint
UPDATE "resourceGatheringGroup" SET "name" = initcap(replace("id", '_', ' ')) WHERE "name" IS NULL;--> statement-breakpoint
ALTER TABLE "resourceGatheringGroup" ALTER COLUMN "name" SET NOT NULL;