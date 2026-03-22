import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { now } from "@/lib/utils";

const createOrderSchema = z.object({
  customerPhone: z.string().min(1),
  customerName: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const search = searchParams.get("search");

    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }
    if (date) {
      conditions.push(eq(orders.pickupDate, date));
    }
    if (search) {
      conditions.push(
        sql`(${orders.customerPhone} LIKE ${"%" + search + "%"} OR ${orders.customerName} LIKE ${"%" + search + "%"})`
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const orderRows = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt));

    const result = await Promise.all(
      orderRows.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        return {
          ...order,
          itemCount: items.length,
          items,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerPhone, customerName, pickupDate, pickupTime, notes, items } =
      parsed.data;

    // Look up products to get prices and names
    const productRows = await Promise.all(
      items.map((item) =>
        db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .get()
      )
    );

    // Validate all products exist
    for (let i = 0; i < items.length; i++) {
      if (!productRows[i]) {
        return NextResponse.json(
          { error: `Product with id ${items[i].productId} not found` },
          { status: 400 }
        );
      }
    }

    // Calculate total
    let totalInCents = 0;
    for (let i = 0; i < items.length; i++) {
      totalInCents += productRows[i]!.priceInCents * items[i].quantity;
    }

    const timestamp = now();

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        customerPhone,
        customerName: customerName ?? null,
        pickupDate: pickupDate ?? null,
        pickupTime: pickupTime ?? null,
        notes: notes ?? null,
        totalInCents,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    // Create order items
    const createdItems = await Promise.all(
      items.map((item, i) =>
        db
          .insert(orderItems)
          .values({
            orderId: order.id,
            productId: item.productId,
            productName: productRows[i]!.name,
            priceInCents: productRows[i]!.priceInCents,
            quantity: item.quantity,
          })
          .returning()
          .then((rows) => rows[0])
      )
    );

    return NextResponse.json(
      { ...order, items: createdItems },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
