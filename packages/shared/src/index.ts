import type { EquipmentDef, ResourceDef } from "./gameData.js";

export * from "./gameData.js"
export * from "./errors.js"

export type HealthResponse = {
    status: 'ok' | 'error';
    db: 'up' | 'down';
    timestamp: string;
};

export type SignUpBody = {
    email: string,
    userName: string,
    password: string
}

export type NumberValidationParams = {
    upperBound?: number
    lowerBound?: number,
    wholeNumber?: boolean
}

export type StringValidationParams = {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  trim?: boolean; 
  lowerCase?: boolean;
};

export type AuthUser = {
  id: string;
  emailVerifiedAt: Date | null;
};

export type AuthRow = {
    sessionId: string;
    expiresAt: Date;
    id: string;
    emailVerifiedAt: Date | null;
}

export type User =  {
    id: string;
    userName: string;
    email: string;
    passwordHash: string;
    emailVerifiedAt: Date | null;
    createdAt: Date;
}

export type AuthState = "Logged-Out" | "Signed-In-Email-Verified" | "Signed-In-Email-Not-Verified"

export type GatheringGroup = {
    id: string,
    name: string,
    mainResource: {
        id: string;
        categoryId: string;
        itemName: string;
        tier: number;
        progressRequirement: number;
        qualityRequirement: number;
        yieldRequirement: number;
        vendorPrice: number;
    },
    levelRequirment: number,
    category: string,
    categoryId: string,
    secondaryResources: {
        dropChance: number,
        resource: ResourceDef
    }[]
}

export type Equipment = {
    id: string;
    name: string;
    categoryId: string | null; // null = universal, fits any category's slots
    typeId: string;
    tier: number;
    levelRequirement: number;
    vendorPrice: number;
};

export type EquipmentStats = {
    equipmentId: string;
    rarityId: string;
    progress: number;
    quality: number;
    yield: number;
    gatheringPoints: number;
}

export type Recipe = {
    recipe: RecipeInfo,
    categoryName: string,
    categoryId: string,
    outputEquipment: Equipment,
    requiredResources: {
        resourceId: string,
        name: string,
        amount: number
    }[]
    stats: Omit<EquipmentStats, "equipmentId">[]
}

export type Action = {
    id: string;
    name: string;
    yieldMultiplier: number;
    qualityMultiplier: number;
    progressMultiplier: number;
    gatheringPointCost: number;
    delaySeconds: number;
};

export type CategoryStats = {
    progress: number;
    quality: number;
    yield: number;
    gatheringPoints: number;
};

export type RecipeInput = { resourceId: string; rarityId: string };

export type TaskTarget =
    | { type: "gather"; gatheringGroupId: string }
    | { type: "craft"; recipeId: string; craftCount: number; inputs: RecipeInput[] };

export type TaskActionEntry = Action & { position: number };

// A recipes row, as the API returns it
export type RecipeInfo = {
    id: string;
    name: string;
    categoryId: string;
    outputEquipmentId: string;
    levelRequirement: number;
    progressRequirement: number;
    qualityRequirement: number;
};

export type ActiveTaskRecipe = RecipeInfo;

export type ActiveTaskRequiredResource = {
    resourceId: string;
    name: string;
    amount: number;
};

type ActiveTaskBase = {
    id: string;
    userId: string;
    craftCount: number | null;
    completedCount: number;
    startTime: Date;
    lastClaimedAt: Date;
    cycleMs: number;           // length of one cycle: base time + every action's delay, fixed when the task starts
    categoryId: string;        // the category the task runs in (its gear slots are locked while it runs)
    actions: TaskActionEntry[];
};

export type GatherActiveTask = ActiveTaskBase & {
    taskType: "gathering";
    gatheringGroupId: string;
    recipeId: null;
};

export type CraftActiveTask = ActiveTaskBase & {
    taskType: "crafting";
    gatheringGroupId: null;
    recipeId: string;
    recipe: ActiveTaskRecipe;
    requiredResources: ActiveTaskRequiredResource[];
    inputs: RecipeInput[];
};

export type ActiveTask = GatherActiveTask | CraftActiveTask;

// ── Claiming ──────────────────────────────────────────────────────

export type Resource = {
    id: string;
    categoryId: string;
    itemName: string;
    tier: number;
    progressRequirement: number;
    qualityRequirement: number;
    yieldRequirement: number;
    vendorPrice: number;
};

export type Rarity = {
    id: string;
    name: string;
    tier: number;
    color: string;
    odds: number;
};
export type CategoryProgress = { categoryId: string, level: number; xp: number };

// One stack the claim added to the inventory. Equipment is listed for when crafting claims are added.
export type ClaimedItem =
    | { type: "resource"; resource: Resource; rarity: Rarity; amount: number }
    | { type: "equipment"; equipment: Equipment; rarity: Rarity; amount: number };

export type ClaimResult = {
    cyclesClaimed: number;     // full cycles since the last claim
    successfulCycles: number;  // cycles whose rotation met the progress requirement
    items: ClaimedItem[];
    nextCycleAt: Date;         // when the next cycle completes (the leftover time is kept)
    taskEnded: boolean;        // the claim finished the task and removed it (crafts done, or out of resources)
    xp: number;                // XP added to the task's category by this claim
};

// ── Inventory ─────────────────────────────────────────────────────

export type ResourceStack = { type: "resource"; resource: Resource; rarity: Rarity; quantity: number };
export type EquipmentStack = {
    type: "equipment";
    equipment: Equipment;
    rarity: Rarity;
    quantity: number;
    stats: CategoryStats | null; // what one item adds when equipped; null = this rarity has no stats and can't be equipped
};
export type InventoryStack = ResourceStack | EquipmentStack;

export type Inventory = {
    gold: number;
    maxSpace: number;
    usedSpace: number;          // number of stacks (one per item + rarity)
    resources: ResourceStack[]; // sorted by item name, then rarest first
    equipment: EquipmentStack[];
};

// ── Selling ───────────────────────────────────────────────────────


export type SellRequest = {
    itemType: "resource" | "equipment";
    itemId: string;
    rarityId: string;
    quantity: number;
};

export type SellResult = {
    goldEarned: number;
    gold: number;              // the player's gold after the sale
    remainingQuantity: number; // left in the stack (0 = the stack is gone)
};

// ── Equipment ─────────────────────────────────────────────────────

export type Slot = { id: string; name: string; categoryId: string; equipmentTypeId: string };

export type EquippedItem = { equipment: Equipment; rarity: Rarity; stats: CategoryStats };

export type EquippedSlot = { slot: Slot; equipped: EquippedItem | null };

export type EquipRequest = { slotId: string; equipmentId: string; rarityId: string };
export type UnequipRequest = { slotId: string };
