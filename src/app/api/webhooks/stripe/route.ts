import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { now } from "@/lib/utils";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { formatPrice } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.error("Stripe webhook: no orderId in session metadata");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(orderId, 10)))
        .then((rows) => rows[0]);

      if (!order) {
        console.error(`Stripe webhook: order ${orderId} not found`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      await db
        .update(orders)
        .set({
          stripePaymentStatus: "paid",
          status: "paid",
          updatedAt: now(),
        })
        .where(eq(orders.id, order.id));

      try {
        await sendTextMessage(
          order.customerPhone,
          `Payment received for Order #${order.id}! Total: ${formatPrice(order.totalInCents)}. We'll notify you when it's ready for pickup.`
        );
      } catch (err) {
        console.error("Failed to send WhatsApp payment confirmation:", err);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
