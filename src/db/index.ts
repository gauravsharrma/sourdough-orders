import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DB = BetterSQLite3Database<typeof schema>;

function createDb(): DB {
  const url = process.env.DATABASE_URL || "";

  if (url.startsWith("file:") || url.endsWith(".db")) {
    // Local development — use better-sqlite3
    const Database = require("better-sqlite3");
    const path = require("path");
    const dbPath = url.startsWith("file:")
      ? path.resolve(process.cwd(), url.replace("file:", "").replace("./", ""))
      : url;
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    return drizzle(sqlite, { schema });
  }

  // Production — use Turso (libsql)
  const { createClient } = require("@libsql/client");
  const { drizzle } = require("drizzle-orm/libsql");
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema }) as unknown as DB;
}

export const db = createDb();
