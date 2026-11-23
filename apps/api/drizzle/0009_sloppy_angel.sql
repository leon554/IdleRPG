ALTER TABLE "recipes" ADD COLUMN "progressRequirement" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "qualityRequirement" integer DEFAULT 50 NOT NULL;