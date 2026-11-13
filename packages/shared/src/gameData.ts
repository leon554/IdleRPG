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
};

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

export const CATEGORIES = {
  mining:      { name: "Mining",      type: "gathering", xpRate: 10 },
  woodcutting: { name: "Woodcutting", type: "gathering", xpRate: 10 },
  smithing:    { name: "Smithing",    type: "crafting",  xpRate: 15 },
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
  progressRequirement: number;
  qualityRequirement: number;
  yieldRequirement: number;
  vendorPrice: number;
};

export const RESOURCES = {
  copper_ore: {
    category: "mining", itemName: "Copper Ore",
    progressRequirement: 100, qualityRequirement: 50, yieldRequirement: 1, vendorPrice: 2,
  },
  iron_ore: {
    category: "mining", itemName: "Iron Ore",
    progressRequirement: 250, qualityRequirement: 120, yieldRequirement: 1, vendorPrice: 5,
  },
  stone: {
    category: "mining", itemName: "Stone",
    progressRequirement: 50, qualityRequirement: 20, yieldRequirement: 1, vendorPrice: 1,
  },
  oak_log: {
    category: "woodcutting", itemName: "Oak Log",
    progressRequirement: 100, qualityRequirement: 50, yieldRequirement: 1, vendorPrice: 2,
  },
} satisfies Record<string, ResourceDef>;

export type ResourceId = keyof typeof RESOURCES;


export type GatheringGroupDef = {
  mainResource: ResourceId;          
  levelRequirement: number;       
  xpRequirement: number;
  secondary: Partial<Record<ResourceId, number>>; 
};

export const GATHERING_GROUPS = {
  copper_vein: {
    mainResource: "copper_ore", levelRequirement: 1, xpRequirement: 0,
    secondary: { stone: 0.25 },
  },
  iron_vein: {
    mainResource: "iron_ore", levelRequirement: 10, xpRequirement: 5_000,
    secondary: { stone: 0.25, copper_ore: 0.05 },
  },
  oak_tree: {
    mainResource: "oak_log", levelRequirement: 1, xpRequirement: 0,
    secondary: {},
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
  levelRequirement: number;
  vendorPrice: number;
  stats: Partial<Record<RarityId, EquipmentStatsDef>>; 
};

export const EQUIPMENT = {
  bronze_pickaxe: {
    name: "Bronze Pickaxe", category: "mining", type: "pickaxe", levelRequirement: 1, vendorPrice: 20,
    stats: {
      common: { progress: 10, quality: 5, yield: 1, gatheringPoints: 1 },
      rare:   { progress: 14, quality: 8, yield: 1.2, gatheringPoints: 2 },
    },
  },
  bronze_axe: {
    name: "Bronze Axe", category: "woodcutting", type: "axe", levelRequirement: 1, vendorPrice: 20,
    stats: {
      common: { progress: 10, quality: 5, yield: 1, gatheringPoints: 1 },
    },
  },
  lucky_charm: {
    name: "Lucky Charm", category: null, type: "charm", levelRequirement: 5, vendorPrice: 100,
    stats: {
      rare: { progress: 0, quality: 10, yield: 1.1, gatheringPoints: 0 },
    },
  },
} satisfies Record<string, EquipmentDef>;

export type EquipmentId = keyof typeof EQUIPMENT;

export type ActionDef = {
  name: string;
  yield: number;
  quality: number;
  progress: number;
};

export const ACTIONS = {
  basic_strike:   { name: "Basic Strike",   yield: 0, quality: 0,  progress: 20 },
  careful_strike: { name: "Careful Strike", yield: 0, quality: 15, progress: 5 },
  bountiful_hit:  { name: "Bountiful Hit",  yield: 1, quality: 0,  progress: 10 },
} satisfies Record<string, ActionDef>;

export type ActionId = keyof typeof ACTIONS;


export type RecipeDef = {
  name: string;
  category: CategoryId;
  output: EquipmentId;      
  levelRequirement: number;
  inputs: Partial<Record<ResourceId, number>>; 
};

export const RECIPES = {
  bronze_pickaxe: {
    name: "Bronze Pickaxe", category: "smithing", output: "bronze_pickaxe", levelRequirement: 1,
    inputs: { copper_ore: 5, oak_log: 2 },
  },
  bronze_axe: {
    name: "Bronze Axe", category: "smithing", output: "bronze_axe", levelRequirement: 1,
    inputs: { copper_ore: 4, oak_log: 3 },
  },
} satisfies Record<string, RecipeDef>;

export type RecipeId = keyof typeof RECIPES;