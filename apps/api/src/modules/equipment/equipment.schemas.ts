import type { Schema } from "../../validation/validate.js";
import { str } from "../../validation/typeValidation.js";

export const equipSchema = {
    slotId: str(),
    equipmentId: str(),
    rarityId: str(),
} satisfies Schema;

export const unequipSchema = {
    slotId: str(),
} satisfies Schema;
