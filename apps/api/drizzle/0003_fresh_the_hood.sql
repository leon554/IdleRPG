ALTER TABLE "categories" ADD COLUMN "baseProgress" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "baseQuality" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "baseYield" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "baseGatheringPoints" double precision DEFAULT 0 NOT NULL;