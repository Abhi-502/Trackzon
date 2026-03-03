import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, numeric } from "drizzle-orm/pg-core";

// Optional sessions table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).default(sql`NULL`),
  lastName: varchar("last_name", { length: 100 }).default(sql`NULL`),
  profileImageUrl: varchar("profile_image_url", { length: 500 }).default(sql`NULL`),
  passwordHash: varchar("password_hash", { length: 255 }).default(sql`NULL`),
  authProvider: varchar("auth_provider", { length: 32 }).default("google").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price history table
export const priceHistory = pgTable("price_history", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 36 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow(),
});

// Type inference
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;
export type UpsertPriceHistory = typeof priceHistory.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
