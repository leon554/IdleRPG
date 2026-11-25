import { db } from "../../db/index.js";
import { badRequest, conflict, notFound } from "../../shared/errors.js";
import type { Connection } from "../../types/db.js";
import * as inventoryRepo from "./inventory.repository.js";
import { unitSellPrice, type Inventory, type SellRequest, type SellResult } from "@idlerpg/shared";
import type { OwnedResource } from "./inventory.types.js";
import { DEFAULT_INVENTORY_MAX_SPACE } from "./inventory.constants.js";
import { Util } from "../../util/generalUtil/util.js";


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

export async function addEquipment(
    userId: string,
    stacks: { equipmentId: string; rarityId: string; amount: number }[],
    conn: Connection = db,
) {
    if (stacks.length === 0) return
    const inventoryId = await getOrCreateInventoryId(userId, conn);
    await inventoryRepo.addToEquipmentStacks(inventoryId, stacks, conn);
}

export async function takeEquipment(userId: string, equipmentId: string, rarityId: string, amount: number, conn: Connection = db) {
    const inventoryId = await inventoryRepo.findUserInventoryId(userId, conn);
    if (!inventoryId) throw badRequest("not_enough_items", { equipmentId, rarityId });

    const remaining = await inventoryRepo.takeFromStack(inventoryId, "equipment", equipmentId, rarityId, amount, conn);
    if (remaining === null) throw badRequest("not_enough_items", { equipmentId, rarityId });
    if (remaining === 0) await inventoryRepo.deleteEmptyStack(inventoryId, "equipment", equipmentId, rarityId, conn);
}

export async function takeResources(
    userId: string,
    stacks: { resourceId: string; rarityId: string; amount: number }[],
    conn: Connection = db,
) {
    const inventoryId = await getUserInventoryId(userId, conn);

    for (const { resourceId, rarityId, amount } of stacks) {
        if (amount <= 0) continue;
        const remaining = await inventoryRepo.takeFromStack(inventoryId, "resource", resourceId, rarityId, amount, conn);
        if (remaining === null) throw badRequest("not_enough_resources", { resourceId, rarityId });
        if (remaining === 0) await inventoryRepo.deleteEmptyStack(inventoryId, "resource", resourceId, rarityId, conn);
    }
}

export async function getSpace(userId: string, conn: Connection = db): Promise<{ used: number; max: number }> {
    const inv = await inventoryRepo.findInventoryByUser(userId, conn);
    if (!inv) return { used: 0, max: DEFAULT_INVENTORY_MAX_SPACE };
    return { used: await inventoryRepo.countDistinctItems(inv.id, conn), max: inv.maxSpace };
}

export async function assertRoomFor(userId: string, itemType: "resource" | "equipment", itemId: string, conn: Connection = db) {
    const inventoryId = await getOrCreateInventoryId(userId, conn);
    if (await inventoryRepo.holdsItem(inventoryId, itemType, itemId, conn)) return;

    const { used, max } = await getSpace(userId, conn);
    if (used >= max) throw conflict("inventory_full", { used, max });
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

    const size = new Set<string>()
    resourceRows.forEach(r => size.add(r.resource.id))
    equipmentRows.forEach(e => size.add(e.equipment.id))

    return {
        gold: inv.gold,
        maxSpace: inv.maxSpace,
        usedSpace: size.size,
        resources: resourceRows.map((r) => ({ type: "resource", ...r })),
        equipment: equipmentRows.map((e) => ({ type: "equipment", ...e })),
    };
}


export async function sellStack(userId: string, { itemType, itemId, rarityId, quantity }: SellRequest): Promise<SellResult> {
    return db.transaction(async (tx) => {
        const inventoryId = await inventoryRepo.findUserInventoryId(userId, tx);
        if (!inventoryId) throw badRequest("not_enough_items"); 

        const priceInfo = await inventoryRepo.findSellPriceInfo(itemType, itemId, rarityId, tx);
        if (!priceInfo) throw badRequest("not_enough_items"); 

        const remainingQuantity = await inventoryRepo.takeFromStack(inventoryId, itemType, itemId, rarityId, quantity, tx);
        if (remainingQuantity === null) throw badRequest("not_enough_items");
        if (remainingQuantity === 0) await inventoryRepo.deleteEmptyStack(inventoryId, itemType, itemId, rarityId, tx);

        const goldEarned = unitSellPrice(priceInfo.vendorPrice, priceInfo.tier) * quantity;
        const gold = await inventoryRepo.addGold(inventoryId, goldEarned, tx);

        return { goldEarned, gold, remainingQuantity };
    });
}
