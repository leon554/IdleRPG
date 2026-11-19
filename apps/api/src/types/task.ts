export type TaskRequirements = {
    categoryId: string;
    levelRequirement: number;
    xpRequirement: number;
};

export type RequiredResources = {
    resourceId: string;
    amount: number;
}[];

export type OwnedResource = {
    resourceId: string;
    rarityId: string;
    quantity: number;
};
