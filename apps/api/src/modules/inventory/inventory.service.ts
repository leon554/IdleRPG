import { db } from "../../db/index.js";
import { notFound } from "../../shared/errors.js";
import type { Connection } from "../../types/db.js";
import * as inventoryRepo from "./inventory.repository.js";
import type { Inventory } from "@idlerpg/shared";
import type { OwnedResource } from "./inventory.types.js";
import { DEFAULT_INVENTORY_MAX_SPACE } from "./inventory.constants.js";


export async function getUserInventoryId(userId: string, conn: Connection = db): Promise<string> {
    const inventoryId = await inventoryRepo.findUserInventoryId(userId, conn);
    if (!inventoryId) throw notFound("inventory_not_found");
    return inventoryId
}

export async function getOwnedResources(userId: string, resourceIds: string[], conn: Connection = db): Promise<OwnedResource[]> {
    const inventoryId = await getUserInventoryId(userId, conn);
    return inventoryRepo.findOwnedResources(inventoryId, resourceIds, conn);
}

export async function getOrCreateInventoryId(userId: string, conn: Connection = db): Promise<string> {
    await inventoryRepo.insertInventoryIfMissing(userId, DEFAULT_INVENTORY_MAX_SPACE, conn);
    return getUserInventoryId(userId, conn);
}

export async function addResources(
    userId: string,
    stacks: { resourceId: string; rarityId: string; amount: number }[],
    conn: Connection = db,
) {
    if (stacks.length === 0) return
    const inventoryId = await getOrCreateInventoryId(userId, conn);
    await inventoryRepo.addToResourceStacks(inventoryId, stacks, conn);
}

export async function getInventory(userId: string): Promise<Inventory> {
    const inv = await inventoryRepo.findInventoryByUser(userId);
    if (!inv) {
        return { gold: 0, maxSpace: DEFAULT_INVENTORY_MAX_SPACE, usedSpace: 0, resources: [], equipment: [] };
    }

    const [resourceRows, equipmentRows] = await Promise.all([
        inventoryRepo.findResourceStacks(inv.id),
        inventoryRepo.findEquipmentStacks(inv.id),
    ]);

    return {
        gold: inv.gold,
        maxSpace: inv.maxSpace,
        usedSpace: resourceRows.length + equipmentRows.length,
        resources: resourceRows.map((r) => ({ type: "resource", ...r })),
        equipment: equipmentRows.map((e) => ({ type: "equipment", ...e })),
    };
}
