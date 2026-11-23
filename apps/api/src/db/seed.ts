import { and, getTableColumns, inArray, notInArray, sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import {  ACTIONS, CATEGORIES, EQUIPMENT, EQUIPMENT_TYPES,GATHERING_GROUPS, RARITIES, RECIPES, RESOURCES, SLOTS, type EquipmentStatsDef, type RarityId, type ResourceId,} from "@idlerpg/shared";
import { db } from "./index.js";
import { actions, categories, equipment, equipmentStats, equipmentType, gatheringGroupSecondaryResources, rarity, recipes, requiredResources, resourceGatheringGroup, resources, slots,} from "./schema.js";


function updateAllExcept<T extends PgTable>(table: T, keys: string[]): Record<string, SQL> {
    const columns = getTableColumns(table);
    return Object.fromEntries(
        Object.entries(columns)
          .filter(([prop]) => !keys.includes(prop))
          .map(([prop, column]) => [prop, sql.raw(`excluded."${column.name}"`)]),
    );
}

function rows<T extends object>(data: Record<string, T>) {
   return Object.entries(data).map(([id, def]) => ({ id, ...def }));
}

async function seed() {
    await db.transaction(async (tx) => {
        await tx.insert(rarity).values(rows(RARITIES))
            .onConflictDoUpdate({ target: rarity.id, set: updateAllExcept(rarity, ["id"]) });

        await tx.insert(categories).values(rows(CATEGORIES))
            .onConflictDoUpdate({ target: categories.id, set: updateAllExcept(categories, ["id"]) });

        await tx.insert(equipmentType).values(rows(EQUIPMENT_TYPES))
            .onConflictDoUpdate({ target: equipmentType.id, set: updateAllExcept(equipmentType, ["id"]) });

        await tx.insert(actions).values(rows(ACTIONS))
            .onConflictDoUpdate({ target: actions.id, set: updateAllExcept(actions, ["id"]) });

        await tx.insert(resources)
            .values(Object.entries(RESOURCES).map(([id, { category, itemName, ...rest }]) => ({
                id, categoryId: category, itemName, ...rest,
            })))
          .onConflictDoUpdate({ target: resources.id, set: updateAllExcept(resources, ["id"]) });

        await tx.insert(slots)
            .values(Object.entries(SLOTS).map(([id, { category, equipmentType: type, name }]) => ({
               id, categoryId: category, equipmentTypeId: type, name,
            })))
            .onConflictDoUpdate({ target: slots.id, set: updateAllExcept(slots, ["id"]) });

        // Slots removed from SLOTS would otherwise linger and show up in the app.
        // equippedItem references slots (restrict), so this fails loudly if anyone still has gear in one.
        await tx.delete(slots).where(notInArray(slots.id, Object.keys(SLOTS)));

        await tx.insert(equipment)
            .values(Object.entries(EQUIPMENT).map(([id, { category, type, name, tier, levelRequirement, vendorPrice }]) => ({
                id, categoryId: category, typeId: type, name, tier, levelRequirement, vendorPrice,
            })))
            .onConflictDoUpdate({ target: equipment.id, set: updateAllExcept(equipment, ["id"]) });
          
        await tx.insert(resourceGatheringGroup)
            .values(Object.entries(GATHERING_GROUPS).map(([id, { mainResource, levelRequirement, xpRequirement, name }]) => ({
                id, mainResourceId: mainResource, levelRequirement, xpRequirement, name
            })))
            .onConflictDoUpdate({
                target: resourceGatheringGroup.id,
                set: updateAllExcept(resourceGatheringGroup, ["id"]),
            });

        await tx.insert(recipes)
            .values(Object.entries(RECIPES).map(([id, { name, category, output, levelRequirement, progressRequirement, qualityRequirement }]) => ({
                id, name, categoryId: category, outputEquipmentId: output, levelRequirement, progressRequirement, qualityRequirement,
            })))
            .onConflictDoUpdate({ target: recipes.id, set: updateAllExcept(recipes, ["id"]) });

        // Upsert instead of delete + insert: equipped items reference these rows (equippedItem_equipmentStats_fk),
        // so only rarities removed from game data are deleted (that fails loudly if someone has one equipped)
        for (const [equipmentId, def] of Object.entries(EQUIPMENT)) {
            const statRows = (Object.entries(def.stats) as [RarityId, EquipmentStatsDef][]).map(([rarityId, stats]) => ({
                equipmentId, rarityId, ...stats,
            }));
            await tx.delete(equipmentStats).where(and(
                inArray(equipmentStats.equipmentId, [equipmentId]),
                notInArray(equipmentStats.rarityId, statRows.map((r) => r.rarityId)),
            ));
            if (statRows.length > 0) {
                await tx.insert(equipmentStats).values(statRows)
                    .onConflictDoUpdate({ target: [equipmentStats.equipmentId, equipmentStats.rarityId], set: updateAllExcept(equipmentStats, ["equipmentId", "rarityId"]) });
            }
        }

        await tx.delete(requiredResources).where(inArray(requiredResources.recipeId, Object.keys(RECIPES)));
        const inputRows = Object.entries(RECIPES).flatMap(([recipeId, def]) =>
            (Object.entries(def.inputs) as [ResourceId, number][]).map(([resourceId, amount]) => ({
                recipeId, resourceId, amount,
            })),
        );
        if (inputRows.length > 0) await tx.insert(requiredResources).values(inputRows);

        await tx.delete(gatheringGroupSecondaryResources)
            .where(inArray(gatheringGroupSecondaryResources.gatheringGroupId, Object.keys(GATHERING_GROUPS)));
        const dropRows = Object.entries(GATHERING_GROUPS).flatMap(([gatheringGroupId, def]) =>
            (Object.entries(def.secondary) as [ResourceId, number][]).map(([resourceId, dropChance]) => ({
                gatheringGroupId, resourceId, dropChance,
            })),
        );
        if (dropRows.length > 0) await tx.insert(gatheringGroupSecondaryResources).values(dropRows);
    });
}

seed()
    .then(() => {
        console.log("Seed complete");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Seed failed", err);
        process.exit(1);
    });