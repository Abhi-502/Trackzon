import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { PriceHistory, ProductWithHistory, TrackMultipleProductsRequest, TrackProductRequest } from "@shared/schema";
import type {
  AuthUserRecord,
  IStorage,
  ProductAlerts,
  ProductForecast,
  PublicTrafficStats,
  StoreComparison,
} from "./storage.types";
import { buildAlerts, buildForecast, buildStoreComparisons, scrapeProductInfo } from "./services/productIntel";

const uri = process.env.MONGODB_URI;
let isConnected = false;

async function connectMongo() {
  if (isConnected) return;
  if (!uri) throw new Error("MONGODB_URI is required when DATA_STORE=mongodb");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || "trackzon" });
  isConnected = true;
}

const CounterSchema = new Schema({ key: { type: String, unique: true }, value: { type: Number, default: 0 } });
const UserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    profileImageUrl: { type: String, default: null },
    passwordHash: { type: String, default: null },
    authProvider: { type: String, enum: ["google", "credentials"], default: "google" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
const ProductSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    productUrl: { type: String, required: true },
    productName: { type: String, required: true },
    platform: { type: String, required: true },
    initialPrice: { type: String, required: true },
    lastCheckedPrice: { type: String, required: true },
    imageUrl: { type: String, default: null },
    trackingStartDate: { type: Date, default: Date.now },
    trackingEndDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false },
);
const PriceHistorySchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    productId: { type: Number, required: true, index: true },
    price: { type: String, required: true },
    checkedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

type MongoUser = InferSchemaType<typeof UserSchema>;
type MongoProduct = InferSchemaType<typeof ProductSchema>;
type MongoHistory = InferSchemaType<typeof PriceHistorySchema>;

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const HistoryModel = mongoose.models.PriceHistory || mongoose.model("PriceHistory", PriceHistorySchema);

async function nextSequence(key: string): Promise<number> {
  await connectMongo();
  const counter = await Counter.findOneAndUpdate({ key }, { $inc: { value: 1 } }, { upsert: true, new: true });
  return counter.value;
}

function toProductWithHistory(product: MongoProduct, history: MongoHistory[]): ProductWithHistory {
  const formattedHistory: PriceHistory[] = history.map((h) => ({
    id: h.id,
    productId: h.productId,
    price: h.price,
    checkedAt: h.checkedAt,
  }));
  return {
    id: product.id,
    userId: product.userId,
    productUrl: product.productUrl,
    productName: product.productName,
    platform: product.platform,
    initialPrice: product.initialPrice,
    lastCheckedPrice: product.lastCheckedPrice,
    imageUrl: product.imageUrl ?? null,
    trackingStartDate: product.trackingStartDate,
    trackingEndDate: product.trackingEndDate,
    isActive: product.isActive,
    priceHistory: formattedHistory,
  };
}

export class MongoStorage implements IStorage {
  async getProducts(userId: string): Promise<ProductWithHistory[]> {
    await connectMongo();
    const products = await ProductModel.find({ userId }).lean();
    const ids = products.map((p) => p.id);
    const history = await HistoryModel.find({ productId: { $in: ids } }).lean();
    const grouped = new Map<number, MongoHistory[]>();
    for (const h of history) {
      const list = grouped.get(h.productId) ?? [];
      list.push(h);
      grouped.set(h.productId, list);
    }
    return products.map((p) => toProductWithHistory(p, grouped.get(p.id) ?? []));
  }

  async getProduct(id: number): Promise<ProductWithHistory | undefined> {
    await connectMongo();
    const product = await ProductModel.findOne({ id }).lean();
    if (!product) return undefined;
    const history = await HistoryModel.find({ productId: id }).lean();
    return toProductWithHistory(product, history);
  }

  async trackProduct(userId: string, data: TrackProductRequest): Promise<ProductWithHistory> {
    await connectMongo();
    const info = await scrapeProductInfo(data.url);
    const trackingEndDate = new Date();
    trackingEndDate.setMonth(trackingEndDate.getMonth() + 1);
    const id = await nextSequence("product_id");
    await ProductModel.create({
      id,
      userId,
      productUrl: data.url,
      productName: info.name,
      platform: info.platform,
      initialPrice: info.price,
      lastCheckedPrice: info.price,
      imageUrl: info.imageUrl,
      trackingEndDate,
      isActive: true,
    });
    await HistoryModel.create({
      id: await nextSequence("history_id"),
      productId: id,
      price: info.price,
    });
    return (await this.getProduct(id))!;
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
    await connectMongo();
    await ProductModel.deleteOne({ userId, id });
    await HistoryModel.deleteMany({ productId: id });
  }

  async toggleActive(userId: string, id: number, isActive: boolean): Promise<ProductWithHistory> {
    await connectMongo();
    const updated = await ProductModel.findOneAndUpdate({ userId, id }, { isActive }, { new: true }).lean();
    if (!updated) throw new Error("Not found");
    const history = await HistoryModel.find({ productId: id }).lean();
    return toProductWithHistory(updated, history);
  }

  async getAllActiveProducts(): Promise<ProductWithHistory[]> {
    await connectMongo();
    const activeProducts = await ProductModel.find({ isActive: true }).lean();
    const ids = activeProducts.map((p) => p.id);
    const history = await HistoryModel.find({ productId: { $in: ids } }).lean();
    const grouped = new Map<number, MongoHistory[]>();
    for (const h of history) {
      const list = grouped.get(h.productId) ?? [];
      list.push(h);
      grouped.set(h.productId, list);
    }
    return activeProducts.map((p) => toProductWithHistory(p, grouped.get(p.id) ?? []));
  }

  async updateProductPrice(productId: number, price: number): Promise<void> {
    await connectMongo();
    await ProductModel.updateOne({ id: productId }, { lastCheckedPrice: price.toString() });
    await HistoryModel.create({
      id: await nextSequence("history_id"),
      productId,
      price: price.toString(),
      checkedAt: new Date(),
    });
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    await connectMongo();
    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    if (!user) return null;
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      passwordHash: user.passwordHash ?? null,
      authProvider: user.authProvider,
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
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
    await connectMongo();
    const userId = `u_${await nextSequence("user_id")}`;
    const user = await UserModel.create({
      userId,
      email: input.email.toLowerCase(),
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      profileImageUrl: input.profileImageUrl ?? null,
      passwordHash: input.passwordHash ?? null,
      authProvider: input.authProvider,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    });
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      passwordHash: user.passwordHash ?? null,
      authProvider: user.authProvider,
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  }

  async touchUserLogin(userId: string): Promise<void> {
    await connectMongo();
    await UserModel.updateOne({ userId }, { lastLoginAt: new Date(), updatedAt: new Date() });
  }

  async getPublicTrafficStats(): Promise<PublicTrafficStats> {
    await connectMongo();
    const [trackedProducts, activeTracks, totalPricePoints] = await Promise.all([
      ProductModel.countDocuments(),
      ProductModel.countDocuments({ isActive: true }),
      HistoryModel.countDocuments(),
    ]);
    return {
      trackedProducts,
      activeTracks,
      totalPricePoints,
      supportedStores: ["Amazon", "Flipkart", "Myntra", "Ajio", "Nykaa"],
      engine: "mongodb",
    };
  }

  async getStoreComparisons(productId: number): Promise<StoreComparison[]> {
    const product = await this.getProduct(productId);
    if (!product) return [];
    return buildStoreComparisons(product);
  }

  async getProductForecast(productId: number): Promise<ProductForecast> {
    const product = await this.getProduct(productId);
    if (!product) return { trend: "stable", confidence: 0, points: [] };
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
