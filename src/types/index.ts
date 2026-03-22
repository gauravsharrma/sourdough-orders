export type OrderStatus =
  | "new"
  | "confirmed"
  | "paid"
  | "baking"
  | "ready"
  | "picked_up"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type ConversationState =
  | "idle"
  | "viewing_menu"
  | "choosing_quantity"
  | "add_more"
  | "choosing_pickup"
  | "confirming"
  | "awaiting_payment";

export interface Product {
  id: number;
  name: string;
  description: string | null;
  priceInCents: number;
  isAvailable: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  customerPhone: string;
  customerName: string | null;
  status: OrderStatus;
  pickupDate: string | null;
  pickupTime: string | null;
  totalInCents: number;
  stripeSessionId: string | null;
  stripePaymentStatus: PaymentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  priceInCents: number;
  quantity: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface Conversation {
  id: number;
  phone: string;
  state: ConversationState;
  context: string | null;
  lastMessageAt: string;
}

export interface ConversationContext {
  items: Array<{ productId: number; productName: string; priceInCents: number; quantity: number }>;
  selectedProductId?: number;
  selectedProductName?: string;
  pickupDate?: string;
  pickupTime?: string;
  orderId?: number;
  stripeUrl?: string;
}
