import type { OrderStatus } from "@/types";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "new",
  "confirmed",
  "paid",
  "baking",
  "ready",
  "picked_up",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  paid: "Paid",
  baking: "Baking",
  ready: "Ready for Pickup",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  confirmed: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  baking: "bg-orange-100 text-orange-800",
  ready: "bg-purple-100 text-purple-800",
  picked_up: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  new: { next: "confirmed", label: "Confirm Order" },
  confirmed: { next: "paid", label: "Mark as Paid" },
  paid: { next: "baking", label: "Start Baking" },
  baking: { next: "ready", label: "Mark Ready" },
  ready: { next: "picked_up", label: "Mark Picked Up" },
};

export const WHATSAPP_STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  confirmed: "Your order #{id} has been confirmed! 🍞",
  baking: "Your order #{id} is now being baked! 🔥",
  ready: "Your order #{id} is ready for pickup! Come get your fresh bread! 🥖",
  picked_up: "Thanks for picking up order #{id}! Enjoy your sourdough! 😊",
  cancelled: "Your order #{id} has been cancelled. Send 'menu' to start a new order.",
};
