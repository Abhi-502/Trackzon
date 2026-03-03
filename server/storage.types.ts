import type {
  ProductWithHistory,
  TrackMultipleProductsRequest,
  TrackProductRequest,
} from "@shared/schema";

export type AuthProvider = "google" | "credentials";

export interface AuthUserRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  passwordHash: string | null;
  authProvider: AuthProvider;
  createdAt: Date | null;
  updatedAt: Date | null;
  lastLoginAt: Date | null;
}

export interface StoreComparison {
  store: string;
  price: number;
  productUrl: string;
  badge?: string;
}

export interface ForecastPoint {
  dayOffset: number;
  predictedPrice: number;
}

export interface ProductForecast {
  trend: "up" | "down" | "stable";
  confidence: number;
  points: ForecastPoint[];
}

export interface ProductAlerts {
  keepaStyleAlert: string;
  honeyCouponAlert: string;
  seasonAlert: string;
}

export interface PublicTrafficStats {
  trackedProducts: number;
  activeTracks: number;
  totalPricePoints: number;
  supportedStores: string[];
  engine: "postgres" | "mongodb";
}

export interface IStorage {
  getProducts(userId: string): Promise<ProductWithHistory[]>;
  getProduct(id: number): Promise<ProductWithHistory | undefined>;
  trackProduct(userId: string, data: TrackProductRequest): Promise<ProductWithHistory>;
  trackMultipleProducts(userId: string, data: TrackMultipleProductsRequest): Promise<ProductWithHistory[]>;
  deleteProduct(userId: string, id: number): Promise<void>;
  toggleActive(userId: string, id: number, isActive: boolean): Promise<ProductWithHistory>;
  getAllActiveProducts(): Promise<ProductWithHistory[]>;
  updateProductPrice(productId: number, price: number): Promise<void>;

  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  createUser(input: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
    passwordHash?: string | null;
    authProvider: AuthProvider;
  }): Promise<AuthUserRecord>;
  touchUserLogin(userId: string): Promise<void>;

  getPublicTrafficStats(): Promise<PublicTrafficStats>;
  getStoreComparisons(productId: number): Promise<StoreComparison[]>;
  getProductForecast(productId: number): Promise<ProductForecast>;
  getProductAlerts(productId: number): Promise<ProductAlerts>;
}
