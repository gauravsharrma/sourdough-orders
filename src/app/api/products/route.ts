import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { now } from "@/lib/utils";

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceInCents: z.number().int().positive(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const result = all
      ? await db.select().from(products).orderBy(products.sortOrder)
      : await db
          .select()
          .from(products)
          .where(eq(products.isAvailable, 1))
          .orderBy(products.sortOrder);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, priceInCents, isAvailable, sortOrder } =
      parsed.data;
    const timestamp = now();

    const result = await db
      .insert(products)
      .values({
        name,
        description: description ?? null,
        priceInCents,
        isAvailable: isAvailable === false ? 0 : 1,
        sortOrder: sortOrder ?? 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
