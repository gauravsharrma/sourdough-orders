import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL || "";

let db: LibSQLDatabase<typeof schema>;

if (url.startsWith("libsql://")) {
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db = drizzleLibsql(client, { schema });
} else {
  // Local development only — dynamic require to avoid bundling native module
  const Database = require(/* webpackIgnore: true */ "better-sqlite3");
  const path = require("path");
  const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");
  const dbPath = url.startsWith("file:")
    ? path.resolve(process.cwd(), url.replace("file:", "").replace("./", ""))
    : path.resolve(process.cwd(), "data", "sourdough.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  db = drizzleSqlite(sqlite, { schema });
}

export { db };
