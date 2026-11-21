import { db } from "../../db/index.js";
import { notFound } from "../../shared/errors.js";
import type { Connection } from "../../types/db.js";
import * as inventoryRepo from "./inventory.repository.js";
import type { OwnedResource } from "./inventory.types.js";


export async function getUserInventoryId(userId: string, conn: Connection = db): Promise<string> {
    const inventoryId = await inventoryRepo.findUserInventoryId(userId, conn);
    if (!inventoryId) throw notFound("inventory_not_found");
    return inventoryId
}

export async function getOwnedResources(userId: string, resourceIds: string[], conn: Connection = db): Promise<OwnedResource[]> {
    const inventoryId = await getUserInventoryId(userId, conn);
    return inventoryRepo.findOwnedResources(inventoryId, resourceIds, conn);
}
