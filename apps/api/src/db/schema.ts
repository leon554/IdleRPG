import { integer, pgTable, serial, text, timestamp, uuid} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  userName: text('userName').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  email: text("email").notNull(),
  emailNormalized: text("emailNormalized").unique().notNull(),
  passwordHash: text("passwordHash").notNull().unique(),
  emailVerifiedAt: timestamp('emailVerifiedAt', { withTimezone: true }),
});

export const session = pgTable("session", {
  id: uuid("id").primaryKey(),
  userId: uuid("userId").notNull().references(() => users.id, {onDelete: "cascade"}),
  sessionHash: text("sessionHash").unique().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("lastUsedAt").notNull(),
  deviceInfo: text("deviceInfo")
})

export const emailVerification = pgTable("emailVerification", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id, {onDelete: "cascade"}),
  purpose: text("purpose"),
  tokenHash: text("tokenHash").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  attempts: integer().notNull().default(0),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})