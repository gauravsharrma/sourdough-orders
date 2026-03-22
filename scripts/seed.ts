import * as schema from "../src/db/schema";

const now = new Date().toISOString();

const sampleProducts = [
  { name: "Classic Sourdough Loaf", description: "Traditional tangy sourdough with a crispy crust", priceInCents: 850, sortOrder: 1 },
  { name: "Rosemary Olive Oil Loaf", description: "Fragrant rosemary and extra virgin olive oil", priceInCents: 1000, sortOrder: 2 },
  { name: "Cinnamon Raisin Sourdough", description: "Sweet cinnamon swirl with plump raisins", priceInCents: 950, sortOrder: 3 },
  { name: "Sourdough Bagels (6-pack)", description: "Chewy bagels with that sourdough tang", priceInCents: 1200, sortOrder: 4 },
  { name: "Sourdough Focaccia", description: "Thick, dimpled focaccia with sea salt and herbs", priceInCents: 1100, sortOrder: 5 },
];

const defaultSettings = [
  { key: "business_name", value: "My Sourdough Bakery" },
  { key: "welcome_message", value: "Welcome to My Sourdough Bakery! Send 'menu' to see what's fresh today." },
  { key: "pickup_hours", value: "Tue-Sat 8am-2pm" },
  { key: "currency", value: "USD" },
];

async function seed() {
  const url = process.env.DATABASE_URL || "";

  let db: any;

  if (url.startsWith("libsql://")) {
    const { createClient } = await import("@libsql/client");
    const { drizzle } = await import("drizzle-orm/libsql");
    const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    db = drizzle(client, { schema });
  } else {
    const Database = (await import("better-sqlite3")).default;
    const path = await import("path");
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const dbPath = url.startsWith("file:")
      ? path.resolve(process.cwd(), url.replace("file:", "").replace("./", ""))
      : path.resolve(__dirname, "..", "data", "sourdough.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite, { schema });
  }

  console.log("Seeding products...");
  for (const product of sampleProducts) {
    await db.insert(schema.products).values({
      ...product,
      isAvailable: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log("Seeding settings...");
  for (const setting of defaultSettings) {
    await db.insert(schema.settings).values(setting);
  }

  console.log("Done! Database seeded successfully.");
}

seed().catch(console.error);
