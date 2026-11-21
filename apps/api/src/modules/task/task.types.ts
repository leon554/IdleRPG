import type { TaskTarget } from "@idlerpg/shared";

export type GatherTarget = Extract<TaskTarget, { type: "gather" }>;
export type CraftTarget = Extract<TaskTarget, { type: "craft" }>;

export type TaskRequirements = {
    categoryId: string;
    levelRequirement: number;
    xpRequirement: number;
};

export type RequiredResource = {
    resourceId: string;
    amount: number;
};
