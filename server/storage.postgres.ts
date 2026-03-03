import { db } from "./db";
import {
  products,
  priceHistory,
  users,
  type ProductWithHistory,
  type TrackProductRequest,
  type TrackMultipleProductsRequest,
} from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";
import type {
  AuthUserRecord,
  IStorage,
  ProductAlerts,
  ProductForecast,
  PublicTrafficStats,
  StoreComparison,
} from "./storage.types";
import { buildAlerts, buildForecast, buildStoreComparisons, scrapeProductInfo } from "./services/productIntel";

function ensureDb() {
  if (!db) {
    throw new Error("PostgreSQL storage is enabled but DATABASE_URL is missing.");
  }
  return db;
}

export class PostgresStorage implements IStorage {
  async getProducts(userId: string): Promise<ProductWithHistory[]> {
    const database = ensureDb();
    return database.query.products.findMany({
      where: eq(products.userId, userId),
      with: { priceHistory: true },
    });
  }

  async getProduct(id: number): Promise<ProductWithHistory | undefined> {
    const database = ensureDb();
    return database.query.products.findFirst({
      where: eq(products.id, id),
      with: { priceHistory: true },
    });
  }

  async trackProduct(userId: string, data: TrackProductRequest): Promise<ProductWithHistory> {
    const database = ensureDb();
    const info = await scrapeProductInfo(data.url);
    const trackingEndDate = new Date();
    trackingEndDate.setMonth(trackingEndDate.getMonth() + 1);

    const [product] = await database
      .insert(products)
      .values({
        userId,
        productUrl: data.url,
        productName: info.name,
        platform: info.platform,
        initialPrice: info.price,
        lastCheckedPrice: info.price,
        imageUrl: info.imageUrl,
        trackingEndDate,
      })
      .returning();

    await database.insert(priceHistory).values({
      productId: product.id,
      price: info.price,
    });

    return (await this.getProduct(product.id))!;
  }

  async trackMultipleProducts(userId: string, data: TrackMultipleProductsRequest): Promise<ProductWithHistory[]> {
    const result: ProductWithHistory[] = [];
    for (const url of data.urls) {
      if (!url) continue;
      result.push(await this.trackProduct(userId, { url }));
    }
    return result;
  }

  async deleteProduct(userId: string, id: number): Promise<void> {
    const database = ensureDb();
    await database.delete(priceHistory).where(eq(priceHistory.productId, id));
    await database.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
  }

  async toggleActive(userId: string, id: number, isActive: boolean): Promise<ProductWithHistory> {
    const database = ensureDb();
    const product = await this.getProduct(id);
    if (!product || product.userId !== userId) throw new Error("Not found");
    await database.update(products).set({ isActive }).where(and(eq(products.id, id), eq(products.userId, userId)));
    return (await this.getProduct(id))!;
  }

  async getAllActiveProducts(): Promise<ProductWithHistory[]> {
    const database = ensureDb();
    return database.query.products.findMany({
      where: eq(products.isActive, true),
      with: { priceHistory: true },
    });
  }

  async updateProductPrice(productId: number, price: number): Promise<void> {
    const database = ensureDb();
    await database.update(products).set({ lastCheckedPrice: price.toString() }).where(eq(products.id, productId));
    await database.insert(priceHistory).values({ productId, price: price.toString() });
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const database = ensureDb();
    const user = await database.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      passwordHash: user.passwordHash,
      authProvider: user.authProvider as AuthUserRecord["authProvider"],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async createUser(input: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
    passwordHash?: string | null;
    authProvider: "google" | "credentials";
  }): Promise<AuthUserRecord> {
    const database = ensureDb();
    const [user] = await database
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        profileImageUrl: input.profileImageUrl ?? null,
        passwordHash: input.passwordHash ?? null,
        authProvider: input.authProvider,
      })
      .returning();
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      passwordHash: user.passwordHash,
      authProvider: user.authProvider as AuthUserRecord["authProvider"],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async touchUserLogin(userId: string): Promise<void> {
    const database = ensureDb();
    await database.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  }

  async getPublicTrafficStats(): Promise<PublicTrafficStats> {
    const database = ensureDb();
    const [productAgg] = await database.select({ count: sql<number>`count(*)` }).from(products);
    const [activeAgg] = await database
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));
    const [historyAgg] = await database.select({ count: sql<number>`count(*)` }).from(priceHistory);
    return {
      trackedProducts: Number(productAgg?.count ?? 0),
      activeTracks: Number(activeAgg?.count ?? 0),
      totalPricePoints: Number(historyAgg?.count ?? 0),
      supportedStores: ["Amazon", "Flipkart", "Myntra", "Ajio", "Nykaa"],
      engine: "postgres",
    };
  }

  async getStoreComparisons(productId: number): Promise<StoreComparison[]> {
    const product = await this.getProduct(productId);
    if (!product) return [];
    return buildStoreComparisons(product);
  }

  async getProductForecast(productId: number): Promise<ProductForecast> {
    const product = await this.getProduct(productId);
    if (!product) {
      return { trend: "stable", confidence: 0, points: [] };
    }
    return buildForecast(product);
  }

  async getProductAlerts(productId: number): Promise<ProductAlerts> {
    const product = await this.getProduct(productId);
    if (!product) {
      return {
        keepaStyleAlert: "Product not found.",
        honeyCouponAlert: "Product not found.",
        seasonAlert: "Product not found.",
      };
    }
    return buildAlerts(product);
  }
}
