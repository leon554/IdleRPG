CREATE TABLE "gatheringGroupSecondaryResources" (
	"gatheringGroupId" text NOT NULL,
	"resourceId" text NOT NULL,
	"dropChance" double precision NOT NULL,
	CONSTRAINT "gatheringGroupSecondaryResources_gatheringGroupId_resourceId_pk" PRIMARY KEY("gatheringGroupId","resourceId"),
	CONSTRAINT "gatheringGroupSecondaryResources_dropChance_check" CHECK ("gatheringGroupSecondaryResources"."dropChance" > 0 AND "gatheringGroupSecondaryResources"."dropChance" <= 1)
);
--> statement-breakpoint
CREATE TABLE "resourceGatheringGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"mainResourceId" text NOT NULL,
	"levelRequirement" integer DEFAULT 1 NOT NULL,
	"xpRequirement" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "resourceGatheringGroup_mainResourceId_unique" UNIQUE("mainResourceId"),
	CONSTRAINT "resourceGatheringGroup_levelRequirement_check" CHECK ("resourceGatheringGroup"."levelRequirement" >= 1),
	CONSTRAINT "resourceGatheringGroup_xpRequirement_check" CHECK ("resourceGatheringGroup"."xpRequirement" >= 0)
);
--> statement-breakpoint
ALTER TABLE "equipmentType" RENAME COLUMN "type" TO "name";--> statement-breakpoint
ALTER TABLE "task" RENAME COLUMN "resourceId" TO "gatheringGroupId";--> statement-breakpoint
ALTER TABLE "equipmentType" DROP CONSTRAINT "equipment_type_unique";--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_levelRequirement_check";--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_target_check";--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_resourceId_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "typeId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "slots" ALTER COLUMN "equipmentTypeId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "levelRequirement" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "gatheringGroupSecondaryResources" ADD CONSTRAINT "gatheringGroupSecondaryResources_gatheringGroupId_resourceGatheringGroup_id_fk" FOREIGN KEY ("gatheringGroupId") REFERENCES "public"."resourceGatheringGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gatheringGroupSecondaryResources" ADD CONSTRAINT "gatheringGroupSecondaryResources_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resourceGatheringGroup" ADD CONSTRAINT "resourceGatheringGroup_mainResourceId_resources_id_fk" FOREIGN KEY ("mainResourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gatheringGroupSecondaryResources_resourceId_index" ON "gatheringGroupSecondaryResources" USING btree ("resourceId");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_gatheringGroupId_resourceGatheringGroup_id_fk" FOREIGN KEY ("gatheringGroupId") REFERENCES "public"."resourceGatheringGroup"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" DROP COLUMN "levelRequirement";--> statement-breakpoint
ALTER TABLE "equipmentType" ADD CONSTRAINT "equipmentType_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_levelRequirement_check" CHECK ("equipment"."levelRequirement" >= 1);--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_target_check" CHECK (("task"."gatheringGroupId" IS NULL) <> ("task"."recipeId" IS NULL));