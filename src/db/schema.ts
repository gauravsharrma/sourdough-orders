import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  priceInCents: integer("price_in_cents").notNull(),
  isAvailable: integer("is_available").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name"),
  status: text("status").notNull().default("new"),
  pickupDate: text("pickup_date"),
  pickupTime: text("pickup_time"),
  totalInCents: integer("total_in_cents").notNull().default(0),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentStatus: text("stripe_payment_status").notNull().default("unpaid"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull().unique(),
  state: text("state").notNull().default("idle"),
  context: text("context"),
  lastMessageAt: text("last_message_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
