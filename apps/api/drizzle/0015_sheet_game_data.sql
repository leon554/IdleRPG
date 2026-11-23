-- Moves existing data onto the game data imported from the design spreadsheet.
-- The seed then upserts the new data and deletes anything left over (failing loudly if it's still referenced).
-- Every statement is a no-op on a fresh database.

-- 1. Remove items that are no longer in the game, along with anything players hold of them.
DELETE FROM "task" WHERE "recipeId" IN ('bronze_pickaxe', 'bronze_axe', 'bronze_hammer');--> statement-breakpoint
DELETE FROM "equippedItem" WHERE "equipmentId" IN ('bronze_pickaxe', 'bronze_axe', 'bronze_hammer', 'lucky_charm');--> statement-breakpoint
DELETE FROM "equipmentCollection" WHERE "equipmentId" IN ('bronze_pickaxe', 'bronze_axe', 'bronze_hammer', 'lucky_charm');--> statement-breakpoint
DELETE FROM "marketListing" WHERE "equipmentId" IN ('bronze_pickaxe', 'bronze_axe', 'bronze_hammer', 'lucky_charm');--> statement-breakpoint
DELETE FROM "recipes" WHERE "id" IN ('bronze_pickaxe', 'bronze_axe', 'bronze_hammer');--> statement-breakpoint
DELETE FROM "equipment" WHERE "id" IN ('bronze_pickaxe', 'bronze_axe', 'bronze_hammer', 'lucky_charm');--> statement-breakpoint

-- 2. Resource "stone" is now "stone_ore": move every stack and reference over, merging stacks that already exist.
INSERT INTO "resources" ("id", "categoryId", "itemName", "tier", "progressRequirement", "qualityRequirement", "yieldRequirement", "vendorPrice")
    SELECT 'stone_ore', "categoryId", 'Stone Ore', "tier", "progressRequirement", "qualityRequirement", "yieldRequirement", "vendorPrice"
    FROM "resources" WHERE "id" = 'stone'
    ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "resourceCollection" ("inventoryId", "resourceId", "rarityId", "quantity")
    SELECT "inventoryId", 'stone_ore', "rarityId", "quantity" FROM "resourceCollection" WHERE "resourceId" = 'stone'
    ON CONFLICT ("inventoryId", "resourceId", "rarityId") DO UPDATE SET "quantity" = "resourceCollection"."quantity" + excluded."quantity";--> statement-breakpoint
DELETE FROM "resourceCollection" WHERE "resourceId" = 'stone';--> statement-breakpoint
UPDATE "taskRecipeInput" SET "resourceId" = 'stone_ore' WHERE "resourceId" = 'stone';--> statement-breakpoint
UPDATE "marketListing" SET "resourceId" = 'stone_ore' WHERE "resourceId" = 'stone';--> statement-breakpoint
UPDATE "trades" SET "resourceId" = 'stone_ore' WHERE "resourceId" = 'stone';--> statement-breakpoint
DELETE FROM "gatheringGroupSecondaryResources" WHERE "resourceId" = 'stone';--> statement-breakpoint
DELETE FROM "requiredResources" WHERE "resourceId" = 'stone';--> statement-breakpoint
DELETE FROM "resources" WHERE "id" = 'stone';--> statement-breakpoint

-- 3. Category "woodcutting" is now "logging" (and its slot "woodcutting_tool" is now "logging_tool").
INSERT INTO "categories" ("id", "name", "type", "xpRate", "baseProgress", "baseQuality", "baseYield", "baseGatheringPoints")
    SELECT 'logging', 'Logging', "type", "xpRate", "baseProgress", "baseQuality", "baseYield", "baseGatheringPoints"
    FROM "categories" WHERE "id" = 'woodcutting'
    ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
UPDATE "resources" SET "categoryId" = 'logging' WHERE "categoryId" = 'woodcutting';--> statement-breakpoint
UPDATE "equipment" SET "categoryId" = 'logging' WHERE "categoryId" = 'woodcutting';--> statement-breakpoint
UPDATE "recipes" SET "categoryId" = 'logging' WHERE "categoryId" = 'woodcutting';--> statement-breakpoint
UPDATE "categoryLevel" SET "categoryId" = 'logging' WHERE "categoryId" = 'woodcutting';--> statement-breakpoint
INSERT INTO "slots" ("id", "categoryId", "equipmentTypeId", "name")
    SELECT 'logging_tool', 'logging', "equipmentTypeId", "name" FROM "slots" WHERE "id" = 'woodcutting_tool'
    ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
UPDATE "equippedItem" SET "slotId" = 'logging_tool' WHERE "slotId" = 'woodcutting_tool';--> statement-breakpoint
DELETE FROM "slots" WHERE "id" = 'woodcutting_tool';--> statement-breakpoint
DELETE FROM "categories" WHERE "id" = 'woodcutting';--> statement-breakpoint

-- 4. "smelting" was an old category with no content; drop players' progress in it so the seed can remove it.
DELETE FROM "categoryLevel" WHERE "categoryId" = 'smelting';
