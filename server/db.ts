import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

let db: any = null;

if (connectionString) {
  const pool = new Pool({
    connectionString,
  });
  db = drizzle(pool, { schema });
}

export { db };
