import type { Schema } from "../../validation/validate.js";
import { int, oneOf, str } from "../../validation/typeValidation.js";

export const sellSchema = {
    itemType: oneOf("resource", "equipment"),
    itemId: str(),
    rarityId: str(),
    quantity: int(1, Number.MAX_SAFE_INTEGER),
} satisfies Schema;
