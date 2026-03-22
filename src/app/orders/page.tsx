import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc, sql, and, like } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatPrice, formatDate, formatPhone } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import Link from "next/link";
import { OrderFilters } from "@/components/orders/order-filters";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;

  let allOrders = db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .all();

  // Filter by status
  if (params.status && params.status !== "all") {
    allOrders = allOrders.filter((o) => o.status === params.status);
  }

  // Filter by search (phone or name)
  if (params.search) {
    const q = params.search.toLowerCase();
    allOrders = allOrders.filter(
      (o) =>
        o.customerPhone.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q))
    );
  }

  // Get item counts per order
  const itemCounts: Record<number, number> = {};
  for (const order of allOrders) {
    const items = db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .all();
    itemCounts[order.id] = items.reduce((sum, i) => sum + i.quantity, 0);
  }

  return (
    <div>
      <Header title="Orders" />
      <OrderFilters
        currentStatus={params.status || "all"}
        currentSearch={params.search || ""}
      />

      <Card className="mt-4">
        {allOrders.length === 0 ? (
          <p className="text-stone-400 py-8 text-center">
            No orders found. Orders from WhatsApp will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Pickup</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50">
                    <td className="py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-amber-700 hover:text-amber-900"
                      >
                        #{order.id}
                      </Link>
                    </td>
                    <td className="py-3">
                      <div>{order.customerName || "Unknown"}</div>
                      <div className="text-sm text-stone-400">
                        {formatPhone(order.customerPhone)}
                      </div>
                    </td>
                    <td className="py-3">{itemCounts[order.id] || 0} items</td>
                    <td className="py-3 font-medium">
                      {formatPrice(order.totalInCents)}
                    </td>
                    <td className="py-3 text-sm">
                      {order.pickupDate
                        ? `${formatDate(order.pickupDate)} ${order.pickupTime || ""}`
                        : "Not set"}
                    </td>
                    <td className="py-3">
                      <Badge
                        className={
                          ORDER_STATUS_COLORS[order.status as OrderStatus] ?? ""
                        }
                      >
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] ??
                          order.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        className={
                          order.stripePaymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-stone-100 text-stone-600"
                        }
                      >
                        {order.stripePaymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
