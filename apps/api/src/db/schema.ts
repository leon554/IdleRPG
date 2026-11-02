import { sql } from "drizzle-orm";
import {pgTable, uuid, text, integer, bigint, doublePrecision, timestamp, primaryKey, unique, index, check,} from "drizzle-orm/pg-core";

const timestamptz = () => timestamp({ withTimezone: true });

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    userName: text().notNull(),
    email: text().notNull(), 
    passwordHash: text().notNull(),
    emailVerifiedAt: timestamptz(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [unique("users_email_unique").on(t.email)],
);

export const session = pgTable(
  "session",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionHash: text().notNull(),
    expiresAt: timestamptz().notNull(),
    createdAt: timestamptz().notNull().defaultNow(),
    lastUsedAt: timestamptz().notNull().defaultNow(),
    deviceInfo: text(),
  },
  (t) => [
    unique("session_sessionHash_unique").on(t.sessionHash),
    index("session_userId_index").on(t.userId),
    index("session_expiresAt_index").on(t.expiresAt),
  ],
);

export const emailVerification = pgTable(
  "emailVerification",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    purpose: text({ enum: ["verify_email", "reset_password"] }).notNull(),
    tokenHash: text().notNull(),
    expiresAt: timestamptz().notNull(),
    attempts: integer().notNull().default(0),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [
    check("emailVerification_purpose_check", sql`${t.purpose} IN ('verify_email', 'reset_password')`),
    check("emailVerification_attempts_check", sql`${t.attempts} >= 0`),
    index("emailVerification_lookup_index").on(t.userId, t.purpose, t.createdAt),
    index("emailVerification_expiresAt_index").on(t.expiresAt),
  ],
);


//Static Game Data
export const categories = pgTable(
  "categories",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    type: text().notNull(),
    xpRate: integer().notNull(),
  },
  (t) => [
    unique("categories_name_unique").on(t.name),
    check("categories_xpRate_check", sql`${t.xpRate} > 0`),
  ],
);

export const rarity = pgTable(
  "rarity",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    tier: integer().notNull(),
    color: text().notNull(),
    odds: doublePrecision().notNull(),
  },
  (t) => [
    unique("rarity_name_unique").on(t.name),
    unique("rarity_tier_unique").on(t.tier),
    check("rarity_tier_check", sql`${t.tier} >= 1`),
    check("rarity_odds_check", sql`${t.odds} > 0`),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: text().primaryKey(),
    categoryId: text().notNull().references(() => categories.id, { onDelete: "restrict" }),
    itemName: text().notNull(),
    levelRequirement: integer().notNull().default(1),
    progressRequirement: integer().notNull().default(0),
    qualityRequirement: integer().notNull().default(0),
    yieldRequirement: integer().notNull().default(0),
    vendorPrice: bigint({ mode: "number" }).notNull().default(0),
  },
  (t) => [
    unique("resources_itemName_unique").on(t.itemName),
    check("resources_levelRequirement_check", sql`${t.levelRequirement} >= 1`),
    check(
      "resources_requirements_check",
      sql`${t.progressRequirement} >= 0 AND ${t.qualityRequirement} >= 0 AND ${t.yieldRequirement} >= 0`,
    ),
    check("resources_vendorPrice_check", sql`${t.vendorPrice} >= 0`),
    index("resources_categoryId_index").on(t.categoryId),
  ],
);

export const equipment = pgTable(
  "equipment",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    // NULL = universal, fits any category's slots
    categoryId: text().references(() => categories.id, { onDelete: "restrict" }),
    typeId: text().references(() => equipmentType.id, { onDelete: "restrict" }),
    vendorPrice: bigint({ mode: "number" }).notNull().default(0),
  },
  (t) => [
    unique("equipment_name_unique").on(t.name),
    check("equipment_vendorPrice_check", sql`${t.vendorPrice} >= 0`),
    index("equipment_categoryId_index").on(t.categoryId),
    index("equipment_typeId_index").on(t.typeId),
  ],
);

export const equipmentType = pgTable(
  "equipmentType",
  {
    id: text().primaryKey(),
    type: text().notNull(),
  },
  (t) => [
    unique("equipment_type_unique").on(t.type),
  ],
);

export const equipmentStats = pgTable(
  "equipmentStats",
  {
    equipmentId: text().notNull().references(() => equipment.id, { onDelete: "cascade" }),
    rarityId: text().notNull().references(() => rarity.id, { onDelete: "restrict" }),
    progress: doublePrecision().notNull().default(0),
    quality: doublePrecision().notNull().default(0),
    yield: doublePrecision().notNull().default(0),
    gatheringPoints: doublePrecision().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.equipmentId, t.rarityId] })],
);

export const slots = pgTable(
  "slots",
  {
    id: text().primaryKey(),
    categoryId: text().notNull().references(() => categories.id, { onDelete: "restrict" }),
    equipmentTypeId: text().references(() => equipmentType.id, { onDelete: "restrict" }),
    name: text().notNull(),
  },
  (t) => [
    unique("slots_category_name_unique").on(t.categoryId, t.name),
    index("slots_equipmentTypeId_index").on(t.equipmentTypeId),
  ],
);

export const actions = pgTable(
  "actions",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    yield: integer().notNull().default(0),
    quality: integer().notNull().default(0),
    progress: integer().notNull().default(0),
  },
  (t) => [unique("actions_name_unique").on(t.name)],
);


export const recipes = pgTable(
  "recipes",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    categoryId: text().notNull().references(() => categories.id, { onDelete: "restrict" }),
    outputEquipmentId: text().notNull().references(() => equipment.id, { onDelete: "restrict" }),
    levelRequirement: integer().notNull().default(1),
  },
  (t) => [
    unique("recipes_name_unique").on(t.name),
    check("recipes_levelRequirement_check", sql`${t.levelRequirement} >= 1`),
    index("recipes_categoryId_index").on(t.categoryId),
  ],
);

export const requiredResources = pgTable(
  "requiredResources",
  {
    recipeId: text().notNull().references(() => recipes.id, { onDelete: "cascade" }),
    resourceId: text().notNull().references(() => resources.id, { onDelete: "restrict" }),
    amount: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.recipeId, t.resourceId] }),
    check("requiredResources_amount_check", sql`${t.amount} > 0`),
    index("requiredResources_resourceId_index").on(t.resourceId),
  ],
);

//Player Data
export const inventory = pgTable(
  "inventory",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    maxSpace: integer().notNull(),
    gold: bigint({ mode: "number" }).notNull().default(0),
  },
  (t) => [
    unique("inventory_userId_unique").on(t.userId),
    check("inventory_maxSpace_check", sql`${t.maxSpace} > 0`),
    check("inventory_gold_check", sql`${t.gold} >= 0`),
  ],
);

export const categoryLevel = pgTable(
  "categoryLevel",
  {
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: text().notNull().references(() => categories.id, { onDelete: "restrict" }),
    level: integer().notNull().default(1),
    xp: bigint({ mode: "number" }).notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.categoryId] }),
    check("categoryLevel_level_check", sql`${t.level} >= 1`),
    check("categoryLevel_xp_check", sql`${t.xp} >= 0`),
    index("categoryLevel_categoryId_index").on(t.categoryId),
  ],
);

export const resourceCollection = pgTable(
  "resourceCollection",
  {
    inventoryId: uuid().notNull().references(() => inventory.id, { onDelete: "cascade" }),
    resourceId: text().notNull().references(() => resources.id, { onDelete: "restrict" }),
    rarityId: text().notNull().references(() => rarity.id, { onDelete: "restrict" }),
    quantity: bigint({ mode: "number" }).notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.inventoryId, t.resourceId, t.rarityId] }),
    check("resourceCollection_quantity_check", sql`${t.quantity} >= 0`),
    index("resourceCollection_resourceId_index").on(t.resourceId),
  ],
);

export const equipmentCollection = pgTable(
  "equipmentCollection",
  {
    inventoryId: uuid().notNull().references(() => inventory.id, { onDelete: "cascade" }),
    equipmentId: text().notNull().references(() => equipment.id, { onDelete: "restrict" }),
    rarityId: text().notNull().references(() => rarity.id, { onDelete: "restrict" }),
    quantity: bigint({ mode: "number" }).notNull().default(0),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.inventoryId, t.equipmentId, t.rarityId] }),
    check("equipmentCollection_quantity_check", sql`${t.quantity} >= 0`),
    index("equipmentCollection_equipmentId_index").on(t.equipmentId),
  ],
);

export const equippedItem = pgTable(
  "equippedItem",
  {
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    slotId: text().notNull().references(() => slots.id, { onDelete: "restrict" }),
    equipmentId: text().notNull().references(() => equipment.id, { onDelete: "restrict" }),
    rarityId: text().notNull().references(() => rarity.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.slotId] }),
    index("equippedItem_equipmentId_index").on(t.equipmentId),
  ],
);


export const task = pgTable(
  "task",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    resourceId: text().references(() => resources.id, { onDelete: "restrict" }),
    recipeId: text().references(() => recipes.id, { onDelete: "restrict" }),
    craftCount: integer(),
    completedCount: integer().notNull().default(0),
    startTime: timestamptz().notNull().defaultNow(),
    lastClaimedAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [
    unique("task_userId_unique").on(t.userId),
    check("task_target_check", sql`(${t.resourceId} IS NULL) <> (${t.recipeId} IS NULL)`),
    check(
      "task_craftCount_check",
      sql`${t.craftCount} IS NULL OR (${t.craftCount} > 0 AND ${t.recipeId} IS NOT NULL)`,
    ),
    check(
      "task_completedCount_check",
      sql`${t.completedCount} >= 0 AND (${t.craftCount} IS NULL OR ${t.completedCount} <= ${t.craftCount})`,
    ),
  ],
);

export const taskAction = pgTable(
  "taskAction",
  {
    taskId: uuid().notNull().references(() => task.id, { onDelete: "cascade" }),
    actionId: text().notNull().references(() => actions.id, { onDelete: "restrict" }),
    position: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.position] }),
    check("taskAction_position_check", sql`${t.position} >= 0`),
    index("taskAction_actionId_index").on(t.actionId),
  ],
);


export const taskRecipeInput = pgTable(
  "taskRecipeInput",
  {
    taskId: uuid().notNull().references(() => task.id, { onDelete: "cascade" }),
    resourceId: text().notNull().references(() => resources.id, { onDelete: "restrict" }),
    rarityId: text().notNull().references(() => rarity.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.resourceId] })],
);


export const marketListing = pgTable(
  "marketListing",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    orderType: text({ enum: ["buy", "sell"] }).notNull(),
    equipmentId: text().references(() => equipment.id, { onDelete: "restrict" }),
    resourceId: text().references(() => resources.id, { onDelete: "restrict" }),
    rarityId: text().notNull().references(() => rarity.id, { onDelete: "restrict" }),
    originalQuantity: bigint({ mode: "number" }).notNull(),
    quantity: bigint({ mode: "number" }).notNull(),
    unitPrice: bigint({ mode: "number" }).notNull(),
    status: text({ enum: ["active", "filled", "cancelled", "expired"] }).notNull().default("active"),
    listedAt: timestamptz().notNull().defaultNow(),
    expiresAt: timestamptz().notNull(),
    collectedAt: timestamptz(),
  },
  (t) => [
    check("marketListing_orderType_check", sql`${t.orderType} IN ('buy', 'sell')`),
    check("marketListing_status_check", sql`${t.status} IN ('active', 'filled', 'cancelled', 'expired')`),
    check("marketListing_item_check", sql`(${t.equipmentId} IS NULL) <> (${t.resourceId} IS NULL)`),
    check(
      "marketListing_quantity_check",
      sql`${t.originalQuantity} > 0 AND ${t.quantity} >= 0 AND ${t.quantity} <= ${t.originalQuantity}`,
    ),
    check("marketListing_unitPrice_check", sql`${t.unitPrice} > 0`),
    check("marketListing_expiry_check", sql`${t.expiresAt} > ${t.listedAt}`),
    index("marketListing_resource_book_index")
      .on(t.resourceId, t.rarityId, t.orderType, t.unitPrice)
      .where(sql`${t.status} = 'active' AND ${t.resourceId} IS NOT NULL`),
    index("marketListing_equipment_book_index")
      .on(t.equipmentId, t.rarityId, t.orderType, t.unitPrice)
      .where(sql`${t.status} = 'active' AND ${t.equipmentId} IS NOT NULL`),
    index("marketListing_userId_index").on(t.userId),
    index("marketListing_expiresAt_index").on(t.expiresAt).where(sql`${t.status} = 'active'`),
  ],
);

export const trades = pgTable(
  "trades",
  {
    id: uuid().primaryKey().defaultRandom(),
    listingId: uuid().references(() => marketListing.id, { onDelete: "set null" }),
    sellerId: uuid().references(() => users.id, { onDelete: "set null" }),
    buyerId: uuid().references(() => users.id, { onDelete: "set null" }),
    equipmentId: text().references(() => equipment.id, { onDelete: "restrict" }),
    resourceId: text().references(() => resources.id, { onDelete: "restrict" }),
    rarityId: text().notNull().references(() => rarity.id, { onDelete: "restrict" }),
    quantity: bigint({ mode: "number" }).notNull(),
    unitPrice: bigint({ mode: "number" }).notNull(),
    tradedAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [
    check("trades_item_check", sql`(${t.equipmentId} IS NULL) <> (${t.resourceId} IS NULL)`),
    check("trades_quantity_check", sql`${t.quantity} > 0`),
    check("trades_unitPrice_check", sql`${t.unitPrice} > 0`),
    index("trades_listingId_index").on(t.listingId),
    index("trades_sellerId_index").on(t.sellerId),
    index("trades_buyerId_index").on(t.buyerId),
    index("trades_resource_history_index")
      .on(t.resourceId, t.rarityId, t.tradedAt)
      .where(sql`${t.resourceId} IS NOT NULL`),
    index("trades_equipment_history_index")
      .on(t.equipmentId, t.rarityId, t.tradedAt)
      .where(sql`${t.equipmentId} IS NOT NULL`),
  ],
);