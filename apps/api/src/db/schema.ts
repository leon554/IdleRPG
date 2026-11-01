import { integer, pgTable, text, timestamp, uuid, index} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:  uuid("id").primaryKey().notNull().defaultRandom(),
  userName: text('userName').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  emailVerifiedAt: timestamp('emailVerifiedAt', { withTimezone: true }),
});

export const session = pgTable("session", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id, {onDelete: "cascade"}),
  sessionHash: text("sessionHash").unique().notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("lastUsedAt", { withTimezone: true }).notNull().defaultNow(),
  deviceInfo: text("deviceInfo")
}, (t) => [
  index().on(t.userId),
  index().on(t.expiresAt),
])

export const emailVerification = pgTable("emailVerification", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id, {onDelete: "cascade"}),
  purpose: text("purpose"),
  tokenHash: text("tokenHash").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  attempts: integer().notNull().default(0),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})