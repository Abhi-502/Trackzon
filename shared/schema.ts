import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export { users };

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  productUrl: text("product_url").notNull(),
  productName: text("product_name").notNull(),
  platform: text("platform").notNull(),
  initialPrice: numeric("initial_price").notNull(),
  lastCheckedPrice: numeric("last_checked_price").notNull(),
  imageUrl: text("image_url"),
  trackingStartDate: timestamp("tracking_start_date").defaultNow().notNull(),
  trackingEndDate: timestamp("tracking_end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  price: numeric("price").notNull(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  priceHistory: many(priceHistory),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, {
    fields: [priceHistory.productId],
    references: [products.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type PriceHistory = typeof priceHistory.$inferSelect;

export const trackProductSchema = z.object({
  url: z.string().url("Must be a valid URL").min(1, "URL is required"),
});

export const trackMultipleProductsSchema = z.object({
  urls: z.array(z.string().url("Must be a valid URL")),
});

export type TrackProductRequest = z.infer<typeof trackProductSchema>;
export type TrackMultipleProductsRequest = z.infer<typeof trackMultipleProductsSchema>;

export type ProductWithHistory = Product & {
  priceHistory: PriceHistory[];
};
