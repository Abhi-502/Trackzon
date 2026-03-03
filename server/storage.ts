import { MongoStorage } from "./storage.mongo";
import { PostgresStorage } from "./storage.postgres";
import type { IStorage } from "./storage.types";

const engine = (process.env.DATA_STORE || "").toLowerCase() === "mongodb" ? "mongodb" : "postgres";

export const storage: IStorage = engine === "mongodb" ? new MongoStorage() : new PostgresStorage();
export const storageEngine = engine;

export type { IStorage } from "./storage.types";
