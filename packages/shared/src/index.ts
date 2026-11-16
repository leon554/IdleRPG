import { EquipmentDef, RecipeDef, ResourceDef } from "./gameData.js";

export * from "./gameData.js"

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
    mainResource: {
        id: string;
        categoryId: string;
        itemName: string;
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
    categoryId: string;
    typeId: string;
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
    recipe: RecipeDef,
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
    yield: number;
    quality: number;
    progress: number;
    gatheringPointCost: number;
};

export type CategoryStats = {
    progress: number;
    quality: number;
    yield: number;
    gatheringPoints: number;
};