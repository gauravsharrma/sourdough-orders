import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { now } from "@/lib/utils";

const ORDER_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "cancelled",
] as const;

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
          validStatuses: ORDER_STATUSES,
        },
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

    const result = await db
      .update(orders)
      .set({ status: parsed.data.status, updatedAt: now() })
      .where(eq(orders.id, Number(id)))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("PATCH /api/orders/[id]/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
