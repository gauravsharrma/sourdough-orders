import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { now } from "@/lib/utils";

const updateOrderSchema = z.object({
  customerPhone: z.string().min(1).optional(),
  customerName: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, Number(id)))
      .get();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return NextResponse.json({ ...order, items });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
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
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(orders)
      .where(eq(orders.id, Number(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: now() };
    const data = parsed.data;

    if (data.customerPhone !== undefined)
      updates.customerPhone = data.customerPhone;
    if (data.customerName !== undefined)
      updates.customerName = data.customerName;
    if (data.pickupDate !== undefined) updates.pickupDate = data.pickupDate;
    if (data.pickupTime !== undefined) updates.pickupTime = data.pickupTime;
    if (data.notes !== undefined) updates.notes = data.notes;

    const result = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, Number(id)))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
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
      .from(orders)
      .where(eq(orders.id, Number(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: now() })
      .where(eq(orders.id, Number(id)))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
