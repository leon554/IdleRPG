-- Each gathering category's "Tool" slot ({category}_tool) is now its "Main Hand" ({category}_main_hand),
-- taking the same tool type. Equipped items move with it; the seed then adds the other slots.
-- Every statement is a no-op on a fresh database.
INSERT INTO "slots" ("id", "categoryId", "equipmentTypeId", "name", "sortOrder")
    SELECT "categoryId" || '_main_hand', "categoryId", "equipmentTypeId", 'Main Hand', 0
    FROM "slots" WHERE "id" IN ('mining_tool', 'logging_tool', 'foraging_tool', 'hunting_tool')
    ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
UPDATE "equippedItem" SET "slotId" = replace("slotId", '_tool', '_main_hand')
    WHERE "slotId" IN ('mining_tool', 'logging_tool', 'foraging_tool', 'hunting_tool');--> statement-breakpoint
DELETE FROM "slots" WHERE "id" IN ('mining_tool', 'logging_tool', 'foraging_tool', 'hunting_tool');
