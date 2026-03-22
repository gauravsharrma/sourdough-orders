import { db } from "@/db";
import { products, orders, orderItems, conversations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice, now } from "@/lib/utils";
import {
  sendTextMessage,
  sendInteractiveList,
  sendInteractiveButtons,
} from "@/lib/whatsapp/client";
import type {
  ConversationState,
  ConversationContext,
  Product,
} from "@/types";
import * as chrono from "chrono-node";

export async function handleIncomingMessage(
  phone: string,
  message: string,
  messageType: "text" | "interactive",
  interactiveId?: string,
  profileName?: string
): Promise<void> {
  const conversation = await loadOrCreateConversation(phone);
  const context: ConversationContext = conversation.context
    ? JSON.parse(conversation.context)
    : { items: [] };
  const state = conversation.state as ConversationState;

  const lowerMessage = message.toLowerCase().trim();

  // Global reset commands
  if (lowerMessage === "cancel" || lowerMessage === "reset") {
    await updateConversation(phone, "idle", { items: [] });
    await sendTextMessage(
      phone,
      'Order cancelled. Send "menu" to start a new order.'
    );
    return;
  }

  switch (state) {
    case "idle": {
      await sendWelcomeAndMenu(phone, profileName);
      await updateConversation(phone, "viewing_menu", context);
      break;
    }

    case "viewing_menu": {
      if (messageType === "interactive" && interactiveId) {
        const productId = parseInt(interactiveId, 10);
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .then((rows) => rows[0]);

        if (!product) {
          await sendTextMessage(
            phone,
            "Sorry, that product is not available. Please select from the menu."
          );
          return;
        }

        context.selectedProductId = product.id;
        context.selectedProductName = product.name;
        await updateConversation(phone, "choosing_quantity", context);
        await sendTextMessage(
          phone,
          `How many *${product.name}* would you like? (1-10)`
        );
      } else if (lowerMessage === "menu" || lowerMessage === "order") {
        await sendProductMenu(phone);
      } else if (lowerMessage === "help") {
        await sendTextMessage(
          phone,
          'Available commands:\n- Send "menu" to see products\n- Send "cancel" to reset\n- Select an item from the menu to start ordering'
        );
      } else {
        await sendTextMessage(
          phone,
          "Please select an item from the menu, or send \"menu\" to see it again."
        );
      }
      break;
    }

    case "choosing_quantity": {
      const quantity = parseInt(lowerMessage, 10);
      if (isNaN(quantity) || quantity < 1 || quantity > 10) {
        await sendTextMessage(
          phone,
          "Please enter a number between 1 and 10."
        );
        return;
      }

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, context.selectedProductId!))
        .then((rows) => rows[0]);

      if (!product) {
        await sendTextMessage(phone, "Product not found. Returning to menu.");
        await sendProductMenu(phone);
        await updateConversation(phone, "viewing_menu", {
          ...context,
          selectedProductId: undefined,
          selectedProductName: undefined,
        });
        return;
      }

      context.items.push({
        productId: product.id,
        productName: product.name,
        priceInCents: product.priceInCents,
        quantity,
      });
      context.selectedProductId = undefined;
      context.selectedProductName = undefined;

      await updateConversation(phone, "add_more", context);
      await sendInteractiveButtons(
        phone,
        `Added ${quantity} x ${product.name}! Would you like to add more items?`,
        [
          { id: "add_more_yes", title: "Yes" },
          { id: "add_more_no", title: "No" },
        ]
      );
      break;
    }

    case "add_more": {
      const isYes =
        (messageType === "interactive" && interactiveId === "add_more_yes") ||
        lowerMessage === "yes" ||
        lowerMessage === "y";
      const isNo =
        (messageType === "interactive" && interactiveId === "add_more_no") ||
        lowerMessage === "no" ||
        lowerMessage === "n";

      if (isYes) {
        await sendProductMenu(phone);
        await updateConversation(phone, "viewing_menu", context);
      } else if (isNo) {
        const summary = formatOrderSummary(context);
        await sendTextMessage(
          phone,
          `${summary}\n\nWhen would you like to pick up? (e.g. "tomorrow at 10am", "Saturday 2pm")`
        );
        await updateConversation(phone, "choosing_pickup", context);
      } else {
        await sendInteractiveButtons(
          phone,
          "Would you like to add more items?",
          [
            { id: "add_more_yes", title: "Yes" },
            { id: "add_more_no", title: "No" },
          ]
        );
      }
      break;
    }

    case "choosing_pickup": {
      const parsed = chrono.parseDate(message, new Date(), {
        forwardDate: true,
      });

      if (!parsed) {
        await sendTextMessage(
          phone,
          'I couldn\'t understand that date/time. Please try again (e.g. "tomorrow at 10am", "Friday 3pm").'
        );
        return;
      }

      const pickupDate = parsed.toISOString().split("T")[0];
      const hours = parsed.getHours().toString().padStart(2, "0");
      const minutes = parsed.getMinutes().toString().padStart(2, "0");
      const pickupTime = `${hours}:${minutes}`;

      context.pickupDate = pickupDate;
      context.pickupTime = pickupTime;

      const summary = formatOrderSummary(context);
      const pickupStr = `${pickupDate} at ${hours}:${minutes}`;
      await sendInteractiveButtons(
        phone,
        `${summary}\n\nPickup: ${pickupStr}\n\nConfirm this order?`,
        [
          { id: "confirm_yes", title: "Confirm" },
          { id: "confirm_no", title: "Cancel" },
        ]
      );
      await updateConversation(phone, "confirming", context);
      break;
    }

    case "confirming": {
      const isYes =
        (messageType === "interactive" && interactiveId === "confirm_yes") ||
        lowerMessage === "yes" ||
        lowerMessage === "y" ||
        lowerMessage === "confirm";
      const isNo =
        (messageType === "interactive" && interactiveId === "confirm_no") ||
        lowerMessage === "no" ||
        lowerMessage === "n";

      if (isYes) {
        const totalInCents = context.items.reduce(
          (sum, item) => sum + item.priceInCents * item.quantity,
          0
        );
        const timestamp = now();

        const [order] = await db
          .insert(orders)
          .values({
            customerPhone: phone,
            customerName: profileName ?? null,
            status: "confirmed",
            pickupDate: context.pickupDate ?? null,
            pickupTime: context.pickupTime ?? null,
            totalInCents,
            stripePaymentStatus: "unpaid",
            createdAt: timestamp,
            updatedAt: timestamp,
          })
          .returning();

        await db.insert(orderItems).values(
          context.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            priceInCents: item.priceInCents,
            quantity: item.quantity,
          }))
        );

        await sendTextMessage(
          phone,
          `Order #${order.id} confirmed! Total: ${formatPrice(totalInCents)}\n\nPayment link coming soon. We'll notify you when your order is ready!`
        );

        await updateConversation(phone, "idle", { items: [] });
      } else if (isNo) {
        await sendTextMessage(
          phone,
          'Order cancelled. Send "menu" to start a new order.'
        );
        await updateConversation(phone, "idle", { items: [] });
      } else {
        await sendInteractiveButtons(
          phone,
          "Please confirm or cancel your order.",
          [
            { id: "confirm_yes", title: "Confirm" },
            { id: "confirm_no", title: "Cancel" },
          ]
        );
      }
      break;
    }

    case "awaiting_payment": {
      if (lowerMessage === "cancel") {
        if (context.orderId) {
          await db
            .update(orders)
            .set({ status: "cancelled", updatedAt: now() })
            .where(eq(orders.id, context.orderId));
        }
        await updateConversation(phone, "idle", { items: [] });
        await sendTextMessage(
          phone,
          'Order cancelled. Send "menu" to start a new order.'
        );
      } else {
        await sendTextMessage(
          phone,
          "You have a pending payment. Please use the payment link sent earlier, or send \"cancel\" to cancel the order."
        );
      }
      break;
    }

    default: {
      await updateConversation(phone, "idle", { items: [] });
      await sendWelcomeAndMenu(phone, profileName);
      await updateConversation(phone, "viewing_menu", { items: [] });
      break;
    }
  }
}

async function loadOrCreateConversation(phone: string) {
  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.phone, phone))
    .then((rows) => rows[0]);

  if (existing) {
    return existing;
  }

  const timestamp = now();
  const [created] = await db
    .insert(conversations)
    .values({
      phone,
      state: "idle",
      context: JSON.stringify({ items: [] }),
      lastMessageAt: timestamp,
    })
    .returning();

  return created;
}

async function updateConversation(
  phone: string,
  state: ConversationState,
  context: ConversationContext
): Promise<void> {
  await db
    .update(conversations)
    .set({
      state,
      context: JSON.stringify(context),
      lastMessageAt: now(),
    })
    .where(eq(conversations.phone, phone));
}

async function sendWelcomeAndMenu(
  phone: string,
  profileName?: string
): Promise<void> {
  const greeting = profileName ? `Hi ${profileName}!` : "Hi there!";
  await sendTextMessage(
    phone,
    `${greeting} Welcome to our bakery. Let's get your order started!`
  );
  await sendProductMenu(phone);
}

async function sendProductMenu(phone: string): Promise<void> {
  const availableProducts = await getProductMenu();

  if (availableProducts.length === 0) {
    await sendTextMessage(
      phone,
      "Sorry, no products are currently available. Please check back later!"
    );
    return;
  }

  const sections = [
    {
      title: "Our Products",
      rows: availableProducts.map((p) => ({
        id: p.id.toString(),
        title: p.name.slice(0, 24),
        description: `${formatPrice(p.priceInCents)}${p.description ? " - " + p.description.slice(0, 48) : ""}`,
      })),
    },
  ];

  await sendInteractiveList(
    phone,
    "Our Menu",
    "Choose an item to add to your order:",
    "View Menu",
    sections
  );
}

async function getProductMenu(): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.isAvailable, 1))
    .orderBy(products.sortOrder);
}

function formatOrderSummary(context: ConversationContext): string {
  const lines = context.items.map(
    (item) =>
      `${item.quantity} x ${item.productName} - ${formatPrice(item.priceInCents * item.quantity)}`
  );
  const total = context.items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );

  return `*Order Summary:*\n${lines.join("\n")}\n\n*Total: ${formatPrice(total)}*`;
}
