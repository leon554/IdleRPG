ALTER TABLE "recipes" DROP CONSTRAINT "recipes_levelRequirement_check";--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "levelRequirement" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_levelRequirement_check" CHECK ("recipes"."levelRequirement" >= 0);