import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL || "./data/sourdough.db";
const isRemote = url.startsWith("libsql://");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: isRemote
    ? { url, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url },
});
