import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Credits table for tracking user credits
 */
export const credits = sqliteTable("credits", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  amount: integer("amount", { mode: "number" }).notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

/**
 * Exports table for tracking export history
 */
export const exportTable = sqliteTable("exports", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  businessId: text("businessId"),
  status: text("status").default("pending").notNull(),
  downloadUrl: text("downloadUrl"),
  cost: integer("cost", { mode: "number" }).default(1).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Credit = typeof credits.$inferSelect;
export type InsertCredit = typeof credits.$inferInsert;
export type Export = typeof exportTable.$inferSelect;
export type InsertExport = typeof exportTable.$inferInsert;

// TODO: Add your tables here
