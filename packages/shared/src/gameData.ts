export type RarityDef = {
  name: string;
  tier: number;   // 1 = common, higher = rarer
  color: string;
  odds: number;   // drop weight
};

export type CategoryDef = {
  name: string;
  type: "gathering" | "crafting";
  xpRate: number;
  baseProgress: number,
  baseQuality: number,
  baseYield: number,
  baseGatheringPoints: number,
};

const baseCategoryStats = {
  baseProgress: 10,
  baseQuality: 10,
  baseYield: 10,
  baseGatheringPoints: 150,
}

export type EquipmentStatsDef = {
  progress: number;
  quality: number;
  yield: number;
  gatheringPoints: number;
};

// Keep rarity colors in sync with apps/mobile/src/theme/colors.js (rarityColors).
export const RARITIES = {
  common:    { name: "Common",    tier: 1, color: "#bcb3a6", odds: 1_000_000 },
  uncommon:  { name: "Uncommon",  tier: 2, color: "#93bf72", odds: 250_000 },
  rare:      { name: "Rare",      tier: 3, color: "#6fa0e3", odds: 50_000 },
  epic:      { name: "Epic",      tier: 4, color: "#b48cdb", odds: 1000 },
  legendary: { name: "Legendary", tier: 5, color: "#f5c542", odds: 10 },
  mythical:  { name: "Mythical",  tier: 6, color: "#e57aa8", odds: 1 },
} satisfies Record<string, RarityDef>;
export type RarityId = keyof typeof RARITIES;

export const CALCULATE_RARITIES_ODDS_SUM = (rarities: Record<string, RarityDef>) => Object.values(rarities).reduce((a, c) => a + c.odds, 0)


export const CRAFT_INPUT_RARITY_BONUS = 0.5;

export const craftRarityMultiplier = (qualityRatio: number, inputs: { tier: number; amount: number }[]): number => {
  const totalAmount = inputs.reduce((sum, i) => sum + i.amount, 0);
  const averageTier = totalAmount > 0 ? inputs.reduce((sum, i) => sum + i.tier * i.amount, 0) / totalAmount : 1;
  return qualityRatio + (averageTier - 1) * CRAFT_INPUT_RARITY_BONUS;
};

export const unitSellPrice = (vendorPrice: number, tier: number): number => vendorPrice ** tier;

export const CATEGORIES = {
  mining:      { name: "Mining",      type: "gathering", xpRate: 10, ...baseCategoryStats },
  woodcutting: { name: "Woodcutting", type: "gathering", xpRate: 10, ...baseCategoryStats},
  smithing:    { name: "Smithing",    type: "crafting",  xpRate: 15, ...baseCategoryStats },
} satisfies Record<string, CategoryDef>;
export type CategoryId = keyof typeof CATEGORIES;

export const EQUIPMENT_TYPES = {
  pickaxe: { name: "Pickaxe" },
  axe:     { name: "Axe" },
  hammer:  { name: "Hammer" },
  charm:   { name: "Charm" },
} satisfies Record<string, { name: string }>;
export type EquipmentTypeId = keyof typeof EQUIPMENT_TYPES;

export type ResourceDef = {
  category: CategoryId;
  itemName: string;
  tier: number;   // item tier (1 = basic material), separate from rarity tier
  progressRequirement: number;
  qualityRequirement: number;
  yieldRequirement: number;
  vendorPrice: number;
};

export const RESOURCES = {
  copper_ore: {
    category: "mining", itemName: "Copper Ore", tier: 1,
    progressRequirement: 100, qualityRequirement: 50, yieldRequirement: 100, vendorPrice: 2,
  },
  iron_ore: {
    category: "mining", itemName: "Iron Ore", tier: 2,
    progressRequirement: 250, qualityRequirement: 120, yieldRequirement: 100, vendorPrice: 5,
  },
  stone: {
    category: "mining", itemName: "Stone", tier: 1,
    progressRequirement: 50, qualityRequirement: 20, yieldRequirement: 100, vendorPrice: 1,
  },
  oak_log: {
    category: "woodcutting", itemName: "Oak Log", tier: 1,
    progressRequirement: 100, qualityRequirement: 50, yieldRequirement: 100, vendorPrice: 2,
  },
} satisfies Record<string, ResourceDef>;

export type ResourceId = keyof typeof RESOURCES;


export type GatheringGroupDef = {
  mainResource: ResourceId;  
  name: string;        
  levelRequirement: number;       
  xpRequirement: number;
  secondary: Partial<Record<ResourceId, number>>; 
};

export const GATHERING_GROUPS = {
  copper_vein: {
    mainResource: "copper_ore", levelRequirement: 0, xpRequirement: 0,
    secondary: { stone: 0.25 }, name: "Copper Vein"
  },
  iron_vein: {
    mainResource: "iron_ore", levelRequirement: 10, xpRequirement: 5_000,
    secondary: { stone: 0.25, copper_ore: 0.05 }, name: "Iron Vein"
  },
  oak_tree: {
    mainResource: "oak_log", levelRequirement: 0, xpRequirement: 0,
    secondary: {}, name: "Oak Tree"
  },
} satisfies Record<string, GatheringGroupDef>;

export type GatheringGroupId = keyof typeof GATHERING_GROUPS;


export type SlotDef = {
  category: CategoryId;
  equipmentType: EquipmentTypeId;  
  name: string;
};

export const SLOTS = {
  mining_tool:      { category: "mining",      equipmentType: "pickaxe", name: "Tool" },
  mining_charm:     { category: "mining",      equipmentType: "charm",   name: "Charm" },
  woodcutting_tool: { category: "woodcutting", equipmentType: "axe",     name: "Tool" },
  smithing_tool:    { category: "smithing",    equipmentType: "hammer",  name: "Tool" },
} satisfies Record<string, SlotDef>;

export type SlotId = keyof typeof SLOTS;

export type EquipmentDef = {
  name: string;
  category: CategoryId | null; 
  type: EquipmentTypeId;
  tier: number;   // item tier (1 = basic gear), separate from rarity tier
  levelRequirement: number;
  vendorPrice: number;
  stats: Partial<Record<RarityId, EquipmentStatsDef>>; 
};

export const EQUIPMENT = {
  bronze_pickaxe: {
    name: "Bronze Pickaxe", category: "mining", type: "pickaxe", tier: 1, levelRequirement: 1, vendorPrice: 20,
    stats: {
      common: { progress: 10, quality: 5, yield: 1, gatheringPoints: 1 },
      rare:   { progress: 14, quality: 8, yield: 1.2, gatheringPoints: 2 },
      epic: { progress: 10, quality: 5, yield: 1, gatheringPoints: 1 },
      legendary:   { progress: 14, quality: 8, yield: 1.2, gatheringPoints: 2 },
      mythical: { progress: 10, quality: 5, yield: 1, gatheringPoints: 1 },
    },
  },
  bronze_axe: {
    name: "Bronze Axe", category: "woodcutting", type: "axe", tier: 1, levelRequirement: 1, vendorPrice: 20,
    stats: {
      common: { progress: 10, quality: 5, yield: 1, gatheringPoints: 1 },
    },
  },
  lucky_charm: {
    name: "Lucky Charm", category: null, type: "charm", tier: 1, levelRequirement: 5, vendorPrice: 100,
    stats: {
      rare: { progress: 0, quality: 10, yield: 1.1, gatheringPoints: 0 },
    },
  },
} satisfies Record<string, EquipmentDef>;

export type EquipmentId = keyof typeof EQUIPMENT;

export type ActionDef = {
  name: string;
  yieldMultiplier: number;
  qualityMultiplier: number;
  progressMultiplier: number;
  gatheringPointCost: number;
  delaySeconds: number;   // added to the task's cycle length for each time the action is in the rotation
};

export const ACTIONS = {
  basic_strike:   { name: "Basic Strike",   yieldMultiplier: 1.3, qualityMultiplier: 0.6,  progressMultiplier: 2, gatheringPointCost: 20, delaySeconds: 0.5 },
  careful_strike: { name: "Careful Strike", yieldMultiplier: 1.5, qualityMultiplier: 1.5, progressMultiplier: 1.5, gatheringPointCost: 30, delaySeconds: 0.5 },
  bountiful_hit:  { name: "Bountiful Hit",  yieldMultiplier: 1, qualityMultiplier: 1,  progressMultiplier: 3, gatheringPointCost: 40, delaySeconds: 0.5 },
} satisfies Record<string, ActionDef>;

export type ActionId = keyof typeof ACTIONS;


export type RecipeDef = {
  name: string;
  category: CategoryId;
  output: EquipmentId;      
  levelRequirement: number;
  progressRequirement: number;
  qualityRequirement: number;
  inputs: Partial<Record<ResourceId, number>>; 
};

export const RECIPES = {
  bronze_pickaxe: {
    name: "Bronze Pickaxe", category: "smithing", output: "bronze_pickaxe", levelRequirement: 0,
    progressRequirement: 100, qualityRequirement: 50,
    inputs: { copper_ore: 5, oak_log: 2 },
  },
  bronze_axe: {
    name: "Bronze Axe", category: "smithing", output: "bronze_axe", levelRequirement: 0,
    progressRequirement: 100, qualityRequirement: 50,
    inputs: { copper_ore: 4, oak_log: 3 },
  },
} satisfies Record<string, RecipeDef>;

export type RecipeId = keyof typeof RECIPES;