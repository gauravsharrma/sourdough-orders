import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createCheckoutSession } from "@/lib/stripe/payment-link";
import { sendTextMessage } from "@/lib/whatsapp/client";
import type { OrderWithItems } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .then((rows) => rows[0]);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const orderWithItems: OrderWithItems = {
      ...order,
      items,
    } as OrderWithItems;

    const paymentUrl = await createCheckoutSession(orderWithItems);

    try {
      await sendTextMessage(
        order.customerPhone,
        `Here's your payment link for Order #${order.id}:\n${paymentUrl}`
      );
    } catch (err) {
      console.error("Failed to send payment link via WhatsApp:", err);
    }

    return NextResponse.json({ url: paymentUrl });
  } catch (error) {
    console.error("POST /api/payments/create-link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
