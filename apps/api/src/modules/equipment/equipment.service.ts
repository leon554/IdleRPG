import type { EquippedSlot, EquipRequest, UnequipRequest } from "@idlerpg/shared";
import { db } from "../../db/index.js";
import { lockUser } from "../../db/helpers.js";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors.js";
import type { Connection } from "../../types/db.js";
import * as inventoryService from "../inventory/inventory.service.js";
import * as progressService from "../progress/progress.service.js";
import * as taskService from "../task/task.service.js";
import * as equipmentRepo from "./equipment.repository.js";

export async function getEquipment(userId: string, conn: Connection = db): Promise<EquippedSlot[]> {
    const rows = await equipmentRepo.findSlotsWithEquipped(userId, conn);
    return rows.map(({ slot, equipment, rarity, stats }) => ({
        slot,
        equipped: equipment && rarity && stats ? { equipment, rarity, stats } : null,
    }));
}

export async function equip(userId: string, { slotId, equipmentId, rarityId }: EquipRequest): Promise<EquippedSlot[]> {
    return db.transaction(async (tx) => {
        await lockUser(userId, tx);
        const slot = await findUnlockedSlot(userId, slotId, tx);

        const found = await equipmentRepo.findEquipmentAtRarity(equipmentId, rarityId, tx);
        const fitsSlot =
            found !== null &&
            found.hasStats &&
            found.equipment.typeId === slot.equipmentTypeId &&
            (found.equipment.categoryId === null || found.equipment.categoryId === slot.categoryId);
        if (!fitsSlot) throw badRequest("equipment_wrong_slot", { slotId, equipmentId, rarityId });

        const { level } = await progressService.getCategoryProgress(userId, slot.categoryId, tx);
        if (level < found.equipment.levelRequirement) {
            throw forbidden("requirements_not_met", { levelRequirement: found.equipment.levelRequirement, level });
        }

        await inventoryService.takeEquipment(userId, equipmentId, rarityId, 1, tx);

        const previous = await equipmentRepo.findEquippedForUpdate(userId, slotId, tx);
        if (previous) await inventoryService.addEquipment(userId, [{ ...previous, amount: 1 }], tx);

        await equipmentRepo.upsertEquipped(userId, slotId, equipmentId, rarityId, tx);
        return getEquipment(userId, tx);
    });
}

export async function unequip(userId: string, { slotId }: UnequipRequest): Promise<EquippedSlot[]> {
    return db.transaction(async (tx) => {
        await lockUser(userId, tx);
        await findUnlockedSlot(userId, slotId, tx);

        const removed = await equipmentRepo.deleteEquipped(userId, slotId, tx);
        if (!removed) throw badRequest("slot_empty", { slotId });

        await inventoryService.addEquipment(userId, [{ ...removed, amount: 1 }], tx);
        return getEquipment(userId, tx);
    });
}

async function findUnlockedSlot(userId: string, slotId: string, tx: Connection) {
    const slot = await equipmentRepo.findSlot(slotId, tx);
    if (!slot) throw notFound("slot_not_found");

    const activeCategoryId = await taskService.getActiveTaskCategoryId(userId, tx);
    if (activeCategoryId === slot.categoryId) throw conflict("slot_locked_by_task", { categoryId: slot.categoryId });

    return slot;
}
