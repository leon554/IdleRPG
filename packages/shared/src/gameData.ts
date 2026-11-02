export type RarityDef = {
  name: string;
  tier: number;   
  color: string;
  odds: number;   
};

export type EquipmentTypeDef = {
    type: string
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
export type ResourceDef = {
  category: CategoryId;
  name: string;
  levelRequirement: number;
  progressRequirement: number;
  qualityRequirement: number;
  yieldRequirement: number;
  vendorPrice: number;
};
export type SlotDef = {
  category: CategoryId;
  name: string;
  type: EquipmentTypeId
};
export type EquipmentDef = {
  name: string;
  category: CategoryId | null; 
  vendorPrice: number;
  stats: Partial<Record<RarityId, EquipmentStatsDef>>; 
  typeId: EquipmentTypeId
};
export type RecipeDef = {
  name: string;
  category: CategoryId;
  output: EquipmentId;      
  levelRequirement: number;
  inputs: Partial<Record<ResourceId, number>>; // resource -> amount per craft
};



export const RARITIES = {
  common:    { name: "Common",    tier: 1, color: "#9e9e9e", odds: 1_000_000 }, //rate: 76.8%
  uncommon:  { name: "Uncommon",  tier: 2, color: "#4caf50", odds: 250_000 },   //rate: 19.2%
  rare:      { name: "Rare",      tier: 3, color: "#2196f3", odds: 50_000 },    //rate: 3.8%
  epic:      { name: "Epic",      tier: 4, color: "#9c27b0", odds: 1000 },      //rate: 0.07%
  legendary: { name: "Legendary", tier: 5, color: "#ff9800", odds: 10 },        //rate: 0.0007%
  mythical:  { name: "Mythical",  tier: 6, color: "#e91e63", odds: 1 },         //rate: 0.0000007%
} satisfies Record<string, RarityDef>; 
export type RarityId = keyof typeof RARITIES;

export const EQUIPMENT_TYPE = {
  main_hand: {type: "Main Hand"},
  second_hand: {type: "Second Hand"},
  head: {type: "Head"},
  torso: {type: "Torso"},
  legs: {type: "Legs"},
  feet: {type: "Feet"},
  hands: {type: "Hands"}
} satisfies Record<string, EquipmentTypeDef>; 
export type EquipmentTypeId = keyof typeof EQUIPMENT_TYPE;

export const CATEGORIES = {
  mining:      { name: "Mining",      type: "gathering", xpRate: 10 },
  woodcutting: { name: "Woodcutting", type: "gathering", xpRate: 10 },
  smelting:    { name: "Smelting",    type: "crafting",  xpRate: 15 },
  woodworking: { name: "WoodWorking", type: "crafting",  xpRate: 15 },
  tooling:     { name: "Tooling",     type: "crafting",  xpRate: 15 },
} satisfies Record<string, CategoryDef>;
export type CategoryId = keyof typeof CATEGORIES;


export const RESOURCES = {
  copper_ore: {
    category: "mining", name: "Copper Ore",
    levelRequirement: 1, progressRequirement: 100, qualityRequirement: 50, yieldRequirement: 100, vendorPrice: 2,
  },
  iron_ore: {
    category: "mining", name: "Iron Ore",
    levelRequirement: 10, progressRequirement: 250, qualityRequirement: 120, yieldRequirement: 150, vendorPrice: 5,
  },
  oak_log: {
    category: "woodcutting", name: "Oak Log",
    levelRequirement: 1, progressRequirement: 100, qualityRequirement: 50, yieldRequirement: 100, vendorPrice: 2,
  },
} satisfies Record<string, ResourceDef>;
export type ResourceId = keyof typeof RESOURCES;


export const SLOTS = {
  mining_tool:      { category: "mining",      name: "Tool", type: "main_hand" },
  mining_head:      { category: "mining",      name: "Helmet", type: "head"},
  woodcutting_tool: { category: "woodcutting", name: "Tool", type: "main_hand" },
  smelting_tool:    { category: "smelting",    name: "Tool", type: "main_hand" },
} satisfies Record<string, SlotDef>;
export type SlotId = keyof typeof SLOTS;


export const EQUIPMENT = {
  bronze_pickaxe: {
    name: "Bronze Pickaxe", category: "mining", vendorPrice: 20, typeId: "main_hand",
    stats: {
      common: { progress: 10, quality: 5, yield: 1, gatheringPoints: 100 },
      rare:   { progress: 14, quality: 8, yield: 1.2, gatheringPoints: 200 },
    }
  },
  bronze_axe: {
    name: "Bronze Axe", category: "woodcutting", vendorPrice: 20, typeId: "main_hand",
    stats: {
      common: { progress: 10, quality: 5, yield: 1, gatheringPoints: 1 },
    },
  },
  lucky_charm: {
    name: "Lucky Charm", category: null, vendorPrice: 100, typeId: "torso",
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

export const RECIPES = {
  bronze_pickaxe: {
    name: "Bronze Pickaxe", category: "smelting", output: "bronze_pickaxe", levelRequirement: 1,
    inputs: { copper_ore: 5, oak_log: 2 },
  },
  bronze_axe: {
    name: "Bronze Axe", category: "smelting", output: "bronze_axe", levelRequirement: 1,
    inputs: { copper_ore: 4, oak_log: 3 },
  },
} satisfies Record<string, RecipeDef>;
export type RecipeId = keyof typeof RECIPES;