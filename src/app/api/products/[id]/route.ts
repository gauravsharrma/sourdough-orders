import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { now } from "@/lib/utils";

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceInCents: z.number().int().positive().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, Number(id)))
      .get();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(products)
      .where(eq(products.id, Number(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: now() };
    const data = parsed.data;

    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.priceInCents !== undefined)
      updates.priceInCents = data.priceInCents;
    if (data.isAvailable !== undefined)
      updates.isAvailable = data.isAvailable ? 1 : 0;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    const result = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, Number(id)))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db
      .select()
      .from(products)
      .where(eq(products.id, Number(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.delete(products).where(eq(products.id, Number(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
