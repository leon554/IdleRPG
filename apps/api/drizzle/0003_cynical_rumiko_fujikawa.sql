CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"yield" integer DEFAULT 0 NOT NULL,
	"quality" integer DEFAULT 0 NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "actions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"xpRate" integer NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_xpRate_check" CHECK ("categories"."xpRate" > 0)
);
--> statement-breakpoint
CREATE TABLE "categoryLevel" (
	"userId" uuid NOT NULL,
	"categoryId" uuid NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "categoryLevel_userId_categoryId_pk" PRIMARY KEY("userId","categoryId"),
	CONSTRAINT "categoryLevel_level_check" CHECK ("categoryLevel"."level" >= 1),
	CONSTRAINT "categoryLevel_xp_check" CHECK ("categoryLevel"."xp" >= 0)
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"categoryId" uuid,
	"vendorPrice" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "equipment_name_unique" UNIQUE("name"),
	CONSTRAINT "equipment_vendorPrice_check" CHECK ("equipment"."vendorPrice" >= 0)
);
--> statement-breakpoint
CREATE TABLE "equipmentCollection" (
	"inventoryId" uuid NOT NULL,
	"equipmentId" uuid NOT NULL,
	"rarityId" uuid NOT NULL,
	"quantity" bigint DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipmentCollection_inventoryId_equipmentId_rarityId_pk" PRIMARY KEY("inventoryId","equipmentId","rarityId"),
	CONSTRAINT "equipmentCollection_quantity_check" CHECK ("equipmentCollection"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "equipmentStats" (
	"equipmentId" uuid NOT NULL,
	"rarityId" uuid NOT NULL,
	"progress" double precision DEFAULT 0 NOT NULL,
	"quality" double precision DEFAULT 0 NOT NULL,
	"yield" double precision DEFAULT 0 NOT NULL,
	"gatheringPoints" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "equipmentStats_equipmentId_rarityId_pk" PRIMARY KEY("equipmentId","rarityId")
);
--> statement-breakpoint
CREATE TABLE "equippedItem" (
	"userId" uuid NOT NULL,
	"slotId" uuid NOT NULL,
	"equipmentId" uuid NOT NULL,
	"rarityId" uuid NOT NULL,
	CONSTRAINT "equippedItem_userId_slotId_pk" PRIMARY KEY("userId","slotId")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"maxSpace" integer NOT NULL,
	"gold" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "inventory_userId_unique" UNIQUE("userId"),
	CONSTRAINT "inventory_maxSpace_check" CHECK ("inventory"."maxSpace" > 0),
	CONSTRAINT "inventory_gold_check" CHECK ("inventory"."gold" >= 0)
);
--> statement-breakpoint
CREATE TABLE "marketListing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"orderType" text NOT NULL,
	"equipmentId" uuid,
	"resourceId" uuid,
	"rarityId" uuid NOT NULL,
	"originalQuantity" bigint NOT NULL,
	"quantity" bigint NOT NULL,
	"unitPrice" bigint NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"listedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"collectedAt" timestamp with time zone,
	CONSTRAINT "marketListing_orderType_check" CHECK ("marketListing"."orderType" IN ('buy', 'sell')),
	CONSTRAINT "marketListing_status_check" CHECK ("marketListing"."status" IN ('active', 'filled', 'cancelled', 'expired')),
	CONSTRAINT "marketListing_item_check" CHECK (("marketListing"."equipmentId" IS NULL) <> ("marketListing"."resourceId" IS NULL)),
	CONSTRAINT "marketListing_quantity_check" CHECK ("marketListing"."originalQuantity" > 0 AND "marketListing"."quantity" >= 0 AND "marketListing"."quantity" <= "marketListing"."originalQuantity"),
	CONSTRAINT "marketListing_unitPrice_check" CHECK ("marketListing"."unitPrice" > 0),
	CONSTRAINT "marketListing_expiry_check" CHECK ("marketListing"."expiresAt" > "marketListing"."listedAt")
);
--> statement-breakpoint
CREATE TABLE "rarity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tier" integer NOT NULL,
	"color" text NOT NULL,
	"odds" double precision NOT NULL,
	CONSTRAINT "rarity_name_unique" UNIQUE("name"),
	CONSTRAINT "rarity_tier_unique" UNIQUE("tier"),
	CONSTRAINT "rarity_tier_check" CHECK ("rarity"."tier" >= 1),
	CONSTRAINT "rarity_odds_check" CHECK ("rarity"."odds" > 0)
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"categoryId" uuid NOT NULL,
	"outputEquipmentId" uuid NOT NULL,
	"levelRequirement" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "recipes_name_unique" UNIQUE("name"),
	CONSTRAINT "recipes_levelRequirement_check" CHECK ("recipes"."levelRequirement" >= 1)
);
--> statement-breakpoint
CREATE TABLE "requiredResources" (
	"recipeId" uuid NOT NULL,
	"resourceId" uuid NOT NULL,
	"amount" integer NOT NULL,
	CONSTRAINT "requiredResources_recipeId_resourceId_pk" PRIMARY KEY("recipeId","resourceId"),
	CONSTRAINT "requiredResources_amount_check" CHECK ("requiredResources"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "resourceCollection" (
	"inventoryId" uuid NOT NULL,
	"resourceId" uuid NOT NULL,
	"rarityId" uuid NOT NULL,
	"quantity" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "resourceCollection_inventoryId_resourceId_rarityId_pk" PRIMARY KEY("inventoryId","resourceId","rarityId"),
	CONSTRAINT "resourceCollection_quantity_check" CHECK ("resourceCollection"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoryId" uuid NOT NULL,
	"itemName" text NOT NULL,
	"levelRequirement" integer DEFAULT 1 NOT NULL,
	"progressRequirement" integer DEFAULT 0 NOT NULL,
	"qualityRequirement" integer DEFAULT 0 NOT NULL,
	"yieldRequirement" integer DEFAULT 0 NOT NULL,
	"vendorPrice" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "resources_itemName_unique" UNIQUE("itemName"),
	CONSTRAINT "resources_levelRequirement_check" CHECK ("resources"."levelRequirement" >= 1),
	CONSTRAINT "resources_requirements_check" CHECK ("resources"."progressRequirement" >= 0 AND "resources"."qualityRequirement" >= 0 AND "resources"."yieldRequirement" >= 0),
	CONSTRAINT "resources_vendorPrice_check" CHECK ("resources"."vendorPrice" >= 0)
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoryId" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "slots_category_name_unique" UNIQUE("categoryId","name")
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"resourceId" uuid,
	"recipeId" uuid,
	"craftCount" integer,
	"completedCount" integer DEFAULT 0 NOT NULL,
	"startTime" timestamp with time zone DEFAULT now() NOT NULL,
	"lastClaimedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_userId_unique" UNIQUE("userId"),
	CONSTRAINT "task_target_check" CHECK (("task"."resourceId" IS NULL) <> ("task"."recipeId" IS NULL)),
	CONSTRAINT "task_craftCount_check" CHECK ("task"."craftCount" IS NULL OR ("task"."craftCount" > 0 AND "task"."recipeId" IS NOT NULL)),
	CONSTRAINT "task_completedCount_check" CHECK ("task"."completedCount" >= 0 AND ("task"."craftCount" IS NULL OR "task"."completedCount" <= "task"."craftCount"))
);
--> statement-breakpoint
CREATE TABLE "taskAction" (
	"taskId" uuid NOT NULL,
	"actionId" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "taskAction_taskId_position_pk" PRIMARY KEY("taskId","position"),
	CONSTRAINT "taskAction_position_check" CHECK ("taskAction"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "taskRecipeInput" (
	"taskId" uuid NOT NULL,
	"resourceId" uuid NOT NULL,
	"rarityId" uuid NOT NULL,
	CONSTRAINT "taskRecipeInput_taskId_resourceId_pk" PRIMARY KEY("taskId","resourceId")
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listingId" uuid,
	"sellerId" uuid,
	"buyerId" uuid,
	"equipmentId" uuid,
	"resourceId" uuid,
	"rarityId" uuid NOT NULL,
	"quantity" bigint NOT NULL,
	"unitPrice" bigint NOT NULL,
	"tradedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trades_item_check" CHECK (("trades"."equipmentId" IS NULL) <> ("trades"."resourceId" IS NULL)),
	CONSTRAINT "trades_quantity_check" CHECK ("trades"."quantity" > 0),
	CONSTRAINT "trades_unitPrice_check" CHECK ("trades"."unitPrice" > 0)
);
--> statement-breakpoint
ALTER TABLE "emailVerification" ALTER COLUMN "purpose" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categoryLevel" ADD CONSTRAINT "categoryLevel_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categoryLevel" ADD CONSTRAINT "categoryLevel_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipmentCollection" ADD CONSTRAINT "equipmentCollection_inventoryId_inventory_id_fk" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipmentCollection" ADD CONSTRAINT "equipmentCollection_equipmentId_equipment_id_fk" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipmentCollection" ADD CONSTRAINT "equipmentCollection_rarityId_rarity_id_fk" FOREIGN KEY ("rarityId") REFERENCES "public"."rarity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipmentStats" ADD CONSTRAINT "equipmentStats_equipmentId_equipment_id_fk" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipmentStats" ADD CONSTRAINT "equipmentStats_rarityId_rarity_id_fk" FOREIGN KEY ("rarityId") REFERENCES "public"."rarity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equippedItem" ADD CONSTRAINT "equippedItem_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equippedItem" ADD CONSTRAINT "equippedItem_slotId_slots_id_fk" FOREIGN KEY ("slotId") REFERENCES "public"."slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equippedItem" ADD CONSTRAINT "equippedItem_equipmentId_equipment_id_fk" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equippedItem" ADD CONSTRAINT "equippedItem_rarityId_rarity_id_fk" FOREIGN KEY ("rarityId") REFERENCES "public"."rarity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketListing" ADD CONSTRAINT "marketListing_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketListing" ADD CONSTRAINT "marketListing_equipmentId_equipment_id_fk" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketListing" ADD CONSTRAINT "marketListing_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketListing" ADD CONSTRAINT "marketListing_rarityId_rarity_id_fk" FOREIGN KEY ("rarityId") REFERENCES "public"."rarity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_outputEquipmentId_equipment_id_fk" FOREIGN KEY ("outputEquipmentId") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requiredResources" ADD CONSTRAINT "requiredResources_recipeId_recipes_id_fk" FOREIGN KEY ("recipeId") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requiredResources" ADD CONSTRAINT "requiredResources_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resourceCollection" ADD CONSTRAINT "resourceCollection_inventoryId_inventory_id_fk" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resourceCollection" ADD CONSTRAINT "resourceCollection_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resourceCollection" ADD CONSTRAINT "resourceCollection_rarityId_rarity_id_fk" FOREIGN KEY ("rarityId") REFERENCES "public"."rarity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_recipeId_recipes_id_fk" FOREIGN KEY ("recipeId") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskAction" ADD CONSTRAINT "taskAction_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskAction" ADD CONSTRAINT "taskAction_actionId_actions_id_fk" FOREIGN KEY ("actionId") REFERENCES "public"."actions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskRecipeInput" ADD CONSTRAINT "taskRecipeInput_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskRecipeInput" ADD CONSTRAINT "taskRecipeInput_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskRecipeInput" ADD CONSTRAINT "taskRecipeInput_rarityId_rarity_id_fk" FOREIGN KEY ("rarityId") REFERENCES "public"."rarity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_listingId_marketListing_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."marketListing"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_sellerId_users_id_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyerId_users_id_fk" FOREIGN KEY ("buyerId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_equipmentId_equipment_id_fk" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_rarityId_rarity_id_fk" FOREIGN KEY ("rarityId") REFERENCES "public"."rarity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categoryLevel_categoryId_index" ON "categoryLevel" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "equipment_categoryId_index" ON "equipment" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "equipmentCollection_equipmentId_index" ON "equipmentCollection" USING btree ("equipmentId");--> statement-breakpoint
CREATE INDEX "equippedItem_equipmentId_index" ON "equippedItem" USING btree ("equipmentId");--> statement-breakpoint
CREATE INDEX "marketListing_resource_book_index" ON "marketListing" USING btree ("resourceId","rarityId","orderType","unitPrice") WHERE "marketListing"."status" = 'active' AND "marketListing"."resourceId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "marketListing_equipment_book_index" ON "marketListing" USING btree ("equipmentId","rarityId","orderType","unitPrice") WHERE "marketListing"."status" = 'active' AND "marketListing"."equipmentId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "marketListing_userId_index" ON "marketListing" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "marketListing_expiresAt_index" ON "marketListing" USING btree ("expiresAt") WHERE "marketListing"."status" = 'active';--> statement-breakpoint
CREATE INDEX "recipes_categoryId_index" ON "recipes" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "requiredResources_resourceId_index" ON "requiredResources" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "resourceCollection_resourceId_index" ON "resourceCollection" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "resources_categoryId_index" ON "resources" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "taskAction_actionId_index" ON "taskAction" USING btree ("actionId");--> statement-breakpoint
CREATE INDEX "trades_listingId_index" ON "trades" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "trades_sellerId_index" ON "trades" USING btree ("sellerId");--> statement-breakpoint
CREATE INDEX "trades_buyerId_index" ON "trades" USING btree ("buyerId");--> statement-breakpoint
CREATE INDEX "trades_resource_history_index" ON "trades" USING btree ("resourceId","rarityId","tradedAt") WHERE "trades"."resourceId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "trades_equipment_history_index" ON "trades" USING btree ("equipmentId","rarityId","tradedAt") WHERE "trades"."equipmentId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "emailVerification_lookup_index" ON "emailVerification" USING btree ("userId","purpose","createdAt");--> statement-breakpoint
CREATE INDEX "emailVerification_expiresAt_index" ON "emailVerification" USING btree ("expiresAt");--> statement-breakpoint
ALTER TABLE "emailVerification" ADD CONSTRAINT "emailVerification_purpose_check" CHECK ("emailVerification"."purpose" IN ('verify_email', 'reset_password'));--> statement-breakpoint
ALTER TABLE "emailVerification" ADD CONSTRAINT "emailVerification_attempts_check" CHECK ("emailVerification"."attempts" >= 0);