ALTER TABLE "recipes" ALTER COLUMN "outputEquipmentId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "outputResourceId" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "outputQuantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_outputResourceId_resources_id_fk" FOREIGN KEY ("outputResourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_output_check" CHECK (("recipes"."outputEquipmentId" IS NULL) <> ("recipes"."outputResourceId" IS NULL));--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_outputQuantity_check" CHECK ("recipes"."outputQuantity" >= 1);