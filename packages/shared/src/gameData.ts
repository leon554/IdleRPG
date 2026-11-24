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

export type ResourceDef = {
  category: CategoryId;
  itemName: string;
  tier: number;  
  progressRequirement: number;
  qualityRequirement: number;
  yieldRequirement: number;
  vendorPrice: number;
};

export type ResourceId = keyof typeof RESOURCES;


export type GatheringGroupDef = {
  mainResource: ResourceId;
  name: string;
  levelRequirement: number;
  xpRequirement: number;
  secondary: Partial<Record<ResourceId, number>>;  
};


export const CALCULATE_RARITIES_ODDS_SUM = (rarities: Record<string, RarityDef>) => Object.values(rarities).reduce((a, c) => a + c.odds, 0)
export const CRAFT_INPUT_RARITY_BONUS = 0.5;

export const craftRarityMultiplier = (qualityRatio: number, inputs: { tier: number; amount: number }[]): number => {
  const totalAmount = inputs.reduce((sum, i) => sum + i.amount, 0);
  const averageTier = totalAmount > 0 ? inputs.reduce((sum, i) => sum + i.tier * i.amount, 0) / totalAmount : 1;
  return qualityRatio + (averageTier - 1) * CRAFT_INPUT_RARITY_BONUS;
};

export const MAX_LEVEL = 99;
export const XP_CURVE = { firstLevelXp: 100, growth: 1.1 };

export const xpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  const { firstLevelXp, growth } = XP_CURVE;
  return Math.floor((firstLevelXp * (growth ** (level - 1) - 1)) / (growth - 1));
};


export const levelForXp = (xp: number): number => {
  if (xp <= 0) return 1;
  const { firstLevelXp, growth } = XP_CURVE;

  const estimate = Math.floor(Math.log((xp * (growth - 1)) / firstLevelXp + 1) / Math.log(growth)) + 1;
  let level = Math.min(MAX_LEVEL, Math.max(1, estimate));

  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  while (level > 1 && xp < xpForLevel(level)) level--;
  return level;
};

export const calculateXp = (xpRate: number, itemTier: number, rarityTier: number, amount = 1): number =>
  xpRate * itemTier * rarityTier * amount;

export const unitSellPrice = (vendorPrice: number, tier: number): number => vendorPrice ** tier;

export const RARITIES = {
  common:    { name: "Common",    tier: 1, color: "#bcb3a6", odds: 1_000_000 },
  uncommon:  { name: "Uncommon",  tier: 2, color: "#93bf72", odds: 250_000 },
  rare:      { name: "Rare",      tier: 3, color: "#6fa0e3", odds: 50_000 },
  epic:      { name: "Epic",      tier: 4, color: "#b48cdb", odds: 1000 },
  legendary: { name: "Legendary", tier: 5, color: "#f5c542", odds: 10 },
  mythical:  { name: "Mythical",  tier: 6, color: "#e57aa8", odds: 1 },
} satisfies Record<string, RarityDef>;
export type RarityId = keyof typeof RARITIES;


export const BALANCE = {
  gather: { progress: 100, quality: 50, yield: 100, growth: 1.4 },
  craft: { baseProgress: 40, progressPerTier: 15, baseQuality: 20, qualityPerTier: 10 },
  toolStatsPerTier: { progress: 5, quality: 5, yield: 2, gatheringPoints: 5 },
  rarityBonus: 0.2,
  resourceVendorPrice: (tier: number) => tier + 1,
  toolVendorPrice: (tier: number) => tier * 3,
};

const gatherRequirements = (tier: number) => {
  const scale = BALANCE.gather.growth ** (tier - 1);
  return {
    progressRequirement: Math.round(BALANCE.gather.progress * scale),
    qualityRequirement: Math.round(BALANCE.gather.quality * scale),
    yieldRequirement: Math.round(BALANCE.gather.yield * scale),
  };
};

const craftRequirements = (tier: number) => ({
  progressRequirement: BALANCE.craft.baseProgress + BALANCE.craft.progressPerTier * tier,
  qualityRequirement: BALANCE.craft.baseQuality + BALANCE.craft.qualityPerTier * tier,
});


const toolStats = (tier: number): Record<RarityId, EquipmentStatsDef> => {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const base = BALANCE.toolStatsPerTier;
  return Object.fromEntries(
    (Object.entries(RARITIES) as [RarityId, RarityDef][]).map(([rarityId, rarity]) => {
      const m = 1 + BALANCE.rarityBonus * (rarity.tier - 1);
      return [rarityId, {
        progress: round1(base.progress * tier * m),
        quality: round1(base.quality * tier * m),
        yield: round1(base.yield * tier * m),
        gatheringPoints: round1(base.gatheringPoints * tier * m),
      }];
    }),
  ) as Record<RarityId, EquipmentStatsDef>;
};

const resource = (category: CategoryId, itemName: string, tier: number): ResourceDef => ({
  category, itemName, tier, ...gatherRequirements(tier), vendorPrice: BALANCE.resourceVendorPrice(tier),
});

export const CATEGORIES = {
  mining:      { name: "Mining",      type: "gathering", xpRate: 10, ...baseCategoryStats },
  logging:     { name: "Logging",     type: "gathering", xpRate: 10, ...baseCategoryStats },
  foraging:    { name: "Foraging",    type: "gathering", xpRate: 10, ...baseCategoryStats },
  hunting:     { name: "Hunting",     type: "gathering", xpRate: 10, ...baseCategoryStats },
  smithing:    { name: "Smithing",    type: "crafting",  xpRate: 15, ...baseCategoryStats },
  woodworking: { name: "Woodworking", type: "crafting",  xpRate: 15, ...baseCategoryStats },
  tooling:     { name: "Tooling",     type: "crafting",  xpRate: 15, ...baseCategoryStats },
} satisfies Record<string, CategoryDef>;
export type CategoryId = keyof typeof CATEGORIES;

export const EQUIPMENT_TYPES = {
  pickaxe:  { name: "Pickaxe" },
  axe:      { name: "Axe" },
  spade:    { name: "Spade" },
  spear:    { name: "Spear" },
  hammer:   { name: "Hammer" },
  saw:      { name: "Saw" },
  chisel:   { name: "Chisel" },
  off_hand: { name: "Off Hand" },
  head:     { name: "Head" },
  torso:    { name: "Torso" },
  legs:     { name: "Legs" },
  hands:    { name: "Hands" },
  feet:     { name: "Feet" },
  jewelry:  { name: "Jewelry" },
} satisfies Record<string, { name: string }>;
export type EquipmentTypeId = keyof typeof EQUIPMENT_TYPES;


export const RESOURCES = {
  // Mining
  stone_ore:       resource("mining", "Stone Ore", 1),
  copper_ore:      resource("mining", "Copper Ore", 2),
  iron_ore:        resource("mining", "Iron Ore", 3),
  silver_ore:      resource("mining", "Silver Ore", 4),
  obsidian_ore:    resource("mining", "Obsidian Ore", 5),
  quartz:          resource("mining", "Quartz", 1),
  clay:            resource("mining", "Clay", 1),
  amethyst:        resource("mining", "Amethyst", 2),
  coal:            resource("mining", "Coal", 2),
  emerald:         resource("mining", "Emerald", 3),
  ruby:            resource("mining", "Ruby", 4),
  diamond:         resource("mining", "Diamond", 5),

  // Logging
  pine_log:        resource("logging", "Pine Log", 1),
  oak_log:         resource("logging", "Oak Log", 2),
  maple_log:       resource("logging", "Maple Log", 3),
  mahogany_log:    resource("logging", "Mahogany Log", 4),
  redwood_log:     resource("logging", "Redwood Log", 5),
  sticks:          resource("logging", "Sticks", 1),
  pinecone:        resource("logging", "Pinecone", 1),
  acorn:           resource("logging", "Acorn", 2),
  maple_sap:       resource("logging", "Maple Sap", 3),
  vines:           resource("logging", "Vines", 4),
  ancient_seed:    resource("logging", "Ancient Seed", 5),

  // Foraging
  jute:            resource("foraging", "Jute", 1),
  hemp:            resource("foraging", "Hemp", 2),
  flax:            resource("foraging", "Flax", 3),
  silk:            resource("foraging", "Silk", 4),
  spider_silk:     resource("foraging", "Spider Silk", 5),
  seeds:           resource("foraging", "Seeds", 1),
  moss:            resource("foraging", "Moss", 1),
  hempseed:        resource("foraging", "Hempseed", 2),
  linseed:         resource("foraging", "Linseed", 3),
  cocoon:          resource("foraging", "Cocoon", 4),
  venom_sac:       resource("foraging", "Venom Sac", 5),

  // Hunting
  rabbit_hide:     resource("hunting", "Rabbit Hide", 1),
  deer_hide:       resource("hunting", "Deer Hide", 2),
  boar_hide:       resource("hunting", "Boar Hide", 3),
  wolf_hide:       resource("hunting", "Wolf Hide", 4),
  bear_hide:       resource("hunting", "Bear Hide", 5),
  bone:            resource("hunting", "Bone", 1),
  rabbit_foot:     resource("hunting", "Rabbit Foot", 1),
  antler:          resource("hunting", "Antler", 2),
  tusk:            resource("hunting", "Tusk", 3),
  wolf_fang:       resource("hunting", "Wolf Fang", 4),
  bear_claw:       resource("hunting", "Bear Claw", 5),

  // Smithing (crafted)
  copper_bar:      resource("smithing", "Copper Bar", 2),
  iron_bar:        resource("smithing", "Iron Bar", 3),
  silver_bar:      resource("smithing", "Silver Bar", 4),
  obsidian_bar:    resource("smithing", "Obsidian Bar", 5),

  // Woodworking (crafted)
  pine_planks:     resource("woodworking", "Pine Planks", 1),
  oak_planks:      resource("woodworking", "Oak Planks", 2),
  maple_planks:    resource("woodworking", "Maple Planks", 3),
  mahogany_planks: resource("woodworking", "Mahogany Planks", 4),
  redwood_planks:  resource("woodworking", "Redwood Planks", 5),
} satisfies Record<string, ResourceDef>;

export const GATHERING_GROUPS = {
  // Mining
  stone_vein:     { name: "Stone Vein",     mainResource: "stone_ore",    levelRequirement: 1,  xpRequirement: 0, secondary: { quartz: 0.1, clay: 0.05 } },
  copper_vein:    { name: "Copper Vein",    mainResource: "copper_ore",   levelRequirement: 10, xpRequirement: 0, secondary: { amethyst: 0.2, coal: 0.08 } },
  iron_vein:      { name: "Iron Vein",      mainResource: "iron_ore",     levelRequirement: 25, xpRequirement: 0, secondary: { emerald: 0.15, copper_ore: 0.04 } },
  silver_vein:    { name: "Silver Vein",    mainResource: "silver_ore",   levelRequirement: 45, xpRequirement: 0, secondary: { ruby: 0.15, iron_ore: 0.03 } },
  obsidian_vein:  { name: "Obsidian Vein",  mainResource: "obsidian_ore", levelRequirement: 70, xpRequirement: 0, secondary: { diamond: 0.1, silver_ore: 0.01 } },

  // Logging
  pine_tree:      { name: "Pine Tree",      mainResource: "pine_log",     levelRequirement: 1,  xpRequirement: 0, secondary: { sticks: 0.25, pinecone: 0.08 } },
  oak_tree:       { name: "Oak Tree",       mainResource: "oak_log",      levelRequirement: 10, xpRequirement: 0, secondary: { pine_log: 0.2, acorn: 0.1 } },
  maple_tree:     { name: "Maple Tree",     mainResource: "maple_log",    levelRequirement: 25, xpRequirement: 0, secondary: { oak_log: 0.15, maple_sap: 0.08 } },
  mahogany_tree:  { name: "Mahogany Tree",  mainResource: "mahogany_log", levelRequirement: 45, xpRequirement: 0, secondary: { maple_log: 0.15, vines: 0.05 } },
  redwood_tree:   { name: "Redwood Tree",   mainResource: "redwood_log",  levelRequirement: 70, xpRequirement: 0, secondary: { mahogany_log: 0.1, ancient_seed: 0.01 } },

  // Foraging
  jute_patch:     { name: "Jute Patch",     mainResource: "jute",         levelRequirement: 1,  xpRequirement: 0, secondary: { seeds: 0.2, moss: 0.08 } },
  hemp_patch:     { name: "Hemp Patch",     mainResource: "hemp",         levelRequirement: 10, xpRequirement: 0, secondary: { jute: 0.2, hempseed: 0.08 } },
  flax_field:     { name: "Flax Field",     mainResource: "flax",         levelRequirement: 25, xpRequirement: 0, secondary: { hemp: 0.15, linseed: 0.08 } },
  silkworm_grove: { name: "Silkworm Grove", mainResource: "silk",         levelRequirement: 45, xpRequirement: 0, secondary: { flax: 0.15, cocoon: 0.04 } },
  spider_nest:    { name: "Spider Nest",    mainResource: "spider_silk",  levelRequirement: 70, xpRequirement: 0, secondary: { silk: 0.1, venom_sac: 0.01 } },

  // Hunting
  rabbit_burrow:  { name: "Rabbit Burrow",  mainResource: "rabbit_hide",  levelRequirement: 1,  xpRequirement: 0, secondary: { bone: 0.2, rabbit_foot: 0.03 } },
  deer_herd:      { name: "Deer Herd",      mainResource: "deer_hide",    levelRequirement: 10, xpRequirement: 0, secondary: { rabbit_hide: 0.2, antler: 0.08 } },
  boar_den:       { name: "Boar Den",       mainResource: "boar_hide",    levelRequirement: 25, xpRequirement: 0, secondary: { deer_hide: 0.15, tusk: 0.06 } },
  wolf_pack:      { name: "Wolf Pack",      mainResource: "wolf_hide",    levelRequirement: 45, xpRequirement: 0, secondary: { boar_hide: 0.15, wolf_fang: 0.05 } },
  bear_cave:      { name: "Bear Cave",      mainResource: "bear_hide",    levelRequirement: 70, xpRequirement: 0, secondary: { wolf_hide: 0.1, bear_claw: 0.01 } },
} satisfies Record<string, GatheringGroupDef>;

export type GatheringGroupId = keyof typeof GATHERING_GROUPS;

// ── Slots ─────────────────────────────────────────────────────────
export type SlotDef = {
  category: CategoryId;
  equipmentType: EquipmentTypeId;
  name: string;
  sortOrder: number;   // display order within the category
};

// What each category's Main Hand takes: its own tool
export const MAIN_HAND_TYPES = {
  mining:      "pickaxe",
  logging:     "axe",
  foraging:    "spade",
  hunting:     "spear",
  smithing:    "hammer",
  woodworking: "saw",
  tooling:     "chisel",
} satisfies Record<CategoryId, EquipmentTypeId>;

// Every category has these slots, in this order. A universal item (category null) fits the matching
// slot in any category, a category item only in its own (one copy per slot either way).
export const SLOT_LAYOUT = [
  { key: "main_hand", name: "Main Hand",   type: "main_hand" },   // MAIN_HAND_TYPES decides the type
  { key: "off_hand",  name: "Second Hand", type: "off_hand" },
  { key: "head",      name: "Head",        type: "head" },
  { key: "torso",     name: "Torso",       type: "torso" },
  { key: "legs",      name: "Legs",        type: "legs" },
  { key: "hands",     name: "Hands",       type: "hands" },
  { key: "feet",      name: "Feet",        type: "feet" },
  { key: "jewelry_1", name: "Jewelry 1",   type: "jewelry" },
] as const;

export type SlotId = `${CategoryId}_${(typeof SLOT_LAYOUT)[number]["key"]}`;   // e.g. "mining_main_hand"

export const SLOTS = Object.fromEntries(
  (Object.keys(CATEGORIES) as CategoryId[]).flatMap((category) =>
    SLOT_LAYOUT.map((slot, i): [SlotId, SlotDef] => [`${category}_${slot.key}`, {
      category,
      name: slot.name,
      equipmentType: slot.type === "main_hand" ? MAIN_HAND_TYPES[category] : slot.type,
      sortOrder: i,
    }]),
  ),
) as Record<SlotId, SlotDef>;

// ── Equipment ─────────────────────────────────────────────────────
export type EquipmentDef = {
  name: string;
  category: CategoryId | null;   // null = universal, fits any category's slot of its type
  type: EquipmentTypeId;
  tier: number;   // item tier (1 = basic gear), separate from rarity tier
  levelRequirement: number;
  vendorPrice: number;
  stats: Partial<Record<RarityId, EquipmentStatsDef>>;   // a rarity without stats can't be crafted or equipped
};

const tool = (name: string, category: CategoryId, type: EquipmentTypeId, tier: number, levelRequirement: number): EquipmentDef => ({
  name, category, type, tier, levelRequirement, vendorPrice: BALANCE.toolVendorPrice(tier), stats: toolStats(tier),
});

export const EQUIPMENT = {
  stone_pickaxe:    tool("Stone Pickaxe",    "mining",   "pickaxe", 1, 1),
  stone_axe:        tool("Stone Axe",        "logging",  "axe",     1, 1),
  stone_spade:      tool("Stone Spade",      "foraging", "spade",   1, 1),
  stone_spear:      tool("Stone Spear",      "hunting",  "spear",   1, 1),

  copper_pickaxe:   tool("Copper Pickaxe",   "mining",   "pickaxe", 2, 10),
  copper_axe:       tool("Copper Axe",       "logging",  "axe",     2, 10),
  copper_spade:     tool("Copper Spade",     "foraging", "spade",   2, 10),
  copper_spear:     tool("Copper Spear",     "hunting",  "spear",   2, 10),

  iron_pickaxe:     tool("Iron Pickaxe",     "mining",   "pickaxe", 3, 25),
  iron_axe:         tool("Iron Axe",         "logging",  "axe",     3, 25),
  iron_spade:       tool("Iron Spade",       "foraging", "spade",   3, 25),
  iron_spear:       tool("Iron Spear",       "hunting",  "spear",   3, 25),

  silver_pickaxe:   tool("Silver Pickaxe",   "mining",   "pickaxe", 4, 45),
  silver_axe:       tool("Silver Axe",       "logging",  "axe",     4, 45),
  silver_spade:     tool("Silver Spade",     "foraging", "spade",   4, 45),
  silver_spear:     tool("Silver Spear",     "hunting",  "spear",   4, 45),

  obsidian_pickaxe: tool("Obsidian Pickaxe", "mining",   "pickaxe", 5, 75),
  obsidian_axe:     tool("Obsidian Axe",     "logging",  "axe",     5, 75),
  obsidian_spade:   tool("Obsidian Spade",   "foraging", "spade",   5, 75),
  obsidian_spear:   tool("Obsidian Spear",   "hunting",  "spear",   5, 75),
} satisfies Record<string, EquipmentDef>;

export type EquipmentId = keyof typeof EQUIPMENT;

// ── Actions ───────────────────────────────────────────────────────
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

// ── Recipes ───────────────────────────────────────────────────────
// A recipe makes either a resource (bars, coal, planks) or a piece of equipment, `outputQuantity` per craft
export type RecipeOutput = { resource: ResourceId } | { equipment: EquipmentId };

export type RecipeDef = {
  name: string;
  category: CategoryId;
  output: RecipeOutput;
  outputQuantity: number;
  levelRequirement: number;
  progressRequirement: number;
  qualityRequirement: number;
  inputs: Partial<Record<ResourceId, number>>;
};

// `tier` sets the progress/quality the rotation has to reach
const recipe = (
  name: string, category: CategoryId, output: RecipeOutput, outputQuantity: number,
  levelRequirement: number, tier: number, inputs: Partial<Record<ResourceId, number>>,
): RecipeDef => ({ name, category, output, outputQuantity, levelRequirement, ...craftRequirements(tier), inputs });

export const RECIPES = {
  // Smithing: bars
  copper_bar:       recipe("Copper Bar",       "smithing", { resource: "copper_bar" },   1, 10, 2, { copper_ore: 2, coal: 1 }),
  iron_bar:         recipe("Iron Bar",         "smithing", { resource: "iron_bar" },     1, 25, 3, { iron_ore: 2, coal: 1 }),
  silver_bar:       recipe("Silver Bar",       "smithing", { resource: "silver_bar" },   1, 45, 4, { silver_ore: 2, coal: 1 }),
  obsidian_bar:     recipe("Obsidian Bar",     "smithing", { resource: "obsidian_bar" }, 1, 75, 5, { obsidian_ore: 2, coal: 1 }),

  // Smithing: coal (better logs give more)
  pine_coal:        recipe("Pine Coal",        "smithing", { resource: "coal" }, 1, 1,  1, { pine_log: 1 }),
  oak_coal:         recipe("Oak Coal",         "smithing", { resource: "coal" }, 2, 10, 2, { oak_log: 1 }),
  maple_coal:       recipe("Maple Coal",       "smithing", { resource: "coal" }, 3, 25, 3, { maple_log: 1 }),
  mahogany_coal:    recipe("Mahogany Coal",    "smithing", { resource: "coal" }, 4, 45, 4, { mahogany_log: 1 }),
  redwood_coal:     recipe("Redwood Coal",     "smithing", { resource: "coal" }, 5, 70, 5, { redwood_log: 1 }),

  // Woodworking: planks
  pine_planks:      recipe("Pine Planks",      "woodworking", { resource: "pine_planks" },     1, 1,  1, { pine_log: 2 }),
  oak_planks:       recipe("Oak Planks",       "woodworking", { resource: "oak_planks" },      1, 10, 2, { oak_log: 2 }),
  maple_planks:     recipe("Maple Planks",     "woodworking", { resource: "maple_planks" },    1, 25, 3, { maple_log: 2 }),
  mahogany_planks:  recipe("Mahogany Planks",  "woodworking", { resource: "mahogany_planks" }, 1, 45, 4, { mahogany_log: 2 }),
  redwood_planks:   recipe("Redwood Planks",   "woodworking", { resource: "redwood_planks" },  1, 70, 5, { redwood_log: 2 }),

  // Tooling: 2 of the tier's material + 2 planks of the matching wood tier
  stone_pickaxe:    recipe("Stone Pickaxe",    "tooling", { equipment: "stone_pickaxe" },    1, 1,  1, { stone_ore: 2, pine_planks: 2 }),
  stone_axe:        recipe("Stone Axe",        "tooling", { equipment: "stone_axe" },        1, 1,  1, { stone_ore: 2, pine_planks: 2 }),
  stone_spade:      recipe("Stone Spade",      "tooling", { equipment: "stone_spade" },      1, 1,  1, { stone_ore: 2, pine_planks: 2 }),
  stone_spear:      recipe("Stone Spear",      "tooling", { equipment: "stone_spear" },      1, 1,  1, { stone_ore: 2, pine_planks: 2 }),

  copper_pickaxe:   recipe("Copper Pickaxe",   "tooling", { equipment: "copper_pickaxe" },   1, 10, 2, { copper_bar: 2, oak_planks: 2 }),
  copper_axe:       recipe("Copper Axe",       "tooling", { equipment: "copper_axe" },       1, 10, 2, { copper_bar: 2, oak_planks: 2 }),
  copper_spade:     recipe("Copper Spade",     "tooling", { equipment: "copper_spade" },     1, 10, 2, { copper_bar: 2, oak_planks: 2 }),
  copper_spear:     recipe("Copper Spear",     "tooling", { equipment: "copper_spear" },     1, 10, 2, { copper_bar: 2, oak_planks: 2 }),

  iron_pickaxe:     recipe("Iron Pickaxe",     "tooling", { equipment: "iron_pickaxe" },     1, 25, 3, { iron_bar: 2, maple_planks: 2 }),
  iron_axe:         recipe("Iron Axe",         "tooling", { equipment: "iron_axe" },         1, 25, 3, { iron_bar: 2, maple_planks: 2 }),
  iron_spade:       recipe("Iron Spade",       "tooling", { equipment: "iron_spade" },       1, 25, 3, { iron_bar: 2, maple_planks: 2 }),
  iron_spear:       recipe("Iron Spear",       "tooling", { equipment: "iron_spear" },       1, 25, 3, { iron_bar: 2, maple_planks: 2 }),

  silver_pickaxe:   recipe("Silver Pickaxe",   "tooling", { equipment: "silver_pickaxe" },   1, 45, 4, { silver_bar: 2, mahogany_planks: 2 }),
  silver_axe:       recipe("Silver Axe",       "tooling", { equipment: "silver_axe" },       1, 45, 4, { silver_bar: 2, mahogany_planks: 2 }),
  silver_spade:     recipe("Silver Spade",     "tooling", { equipment: "silver_spade" },     1, 45, 4, { silver_bar: 2, mahogany_planks: 2 }),
  silver_spear:     recipe("Silver Spear",     "tooling", { equipment: "silver_spear" },     1, 45, 4, { silver_bar: 2, mahogany_planks: 2 }),

  obsidian_pickaxe: recipe("Obsidian Pickaxe", "tooling", { equipment: "obsidian_pickaxe" }, 1, 75, 5, { obsidian_bar: 2, redwood_planks: 2 }),
  obsidian_axe:     recipe("Obsidian Axe",     "tooling", { equipment: "obsidian_axe" },     1, 75, 5, { obsidian_bar: 2, redwood_planks: 2 }),
  obsidian_spade:   recipe("Obsidian Spade",   "tooling", { equipment: "obsidian_spade" },   1, 75, 5, { obsidian_bar: 2, redwood_planks: 2 }),
  obsidian_spear:   recipe("Obsidian Spear",   "tooling", { equipment: "obsidian_spear" },   1, 75, 5, { obsidian_bar: 2, redwood_planks: 2 }),
} satisfies Record<string, RecipeDef>;

export type RecipeId = keyof typeof RECIPES;
