import { stripe } from "@/lib/stripe/client";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { now } from "@/lib/utils";
import type { OrderWithItems } from "@/types";

export async function createCheckoutSession(
  order: OrderWithItems
): Promise<string> {
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.productName,
      },
      unit_amount: item.priceInCents,
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/cancel`,
    metadata: {
      orderId: order.id.toString(),
    },
  });

  await db
    .update(orders)
    .set({
      stripeSessionId: session.id,
      updatedAt: now(),
    })
    .where(eq(orders.id, order.id));

  return session.url!;
}
