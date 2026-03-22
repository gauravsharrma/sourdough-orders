import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatPrice, formatDate, formatPhone, formatDateTime } from "@/lib/utils";
import { StatusUpdater } from "@/components/orders/status-updater";
import type { OrderStatus } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.select().from(orders).where(eq(orders.id, parseInt(id))).get();

  if (!order) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .all();

  return (
    <div>
      <Header title={`Order #${order.id}`}>
        <Link
          href="/orders"
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          &larr; Back to Orders
        </Link>
      </Header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Order Items">
            <div className="mt-2 divide-y divide-stone-100">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between py-3">
                  <div>
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-stone-400 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.priceInCents * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-3 font-bold">
                <span>Total</span>
                <span>{formatPrice(order.totalInCents)}</span>
              </div>
            </div>
          </Card>

          {order.notes && (
            <Card title="Notes">
              <p className="mt-2 text-stone-600">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Status">
            <div className="mt-2 space-y-3">
              <Badge
                className={`${ORDER_STATUS_COLORS[order.status as OrderStatus] ?? ""} text-base px-3 py-1`}
              >
                {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
              </Badge>
              <StatusUpdater
                orderId={order.id}
                currentStatus={order.status as OrderStatus}
              />
            </div>
          </Card>

          <Card title="Customer">
            <div className="mt-2 space-y-1">
              <p className="font-medium">{order.customerName || "Unknown"}</p>
              <p className="text-stone-500">{formatPhone(order.customerPhone)}</p>
            </div>
          </Card>

          <Card title="Pickup">
            <div className="mt-2">
              {order.pickupDate ? (
                <p>
                  {formatDate(order.pickupDate)}{" "}
                  {order.pickupTime && `at ${order.pickupTime}`}
                </p>
              ) : (
                <p className="text-stone-400">Not scheduled</p>
              )}
            </div>
          </Card>

          <Card title="Payment">
            <div className="mt-2">
              <Badge
                className={
                  order.stripePaymentStatus === "paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-stone-100 text-stone-600"
                }
              >
                {order.stripePaymentStatus}
              </Badge>
              {order.stripeSessionId && (
                <p className="text-xs text-stone-400 mt-2 break-all">
                  Session: {order.stripeSessionId}
                </p>
              )}
            </div>
          </Card>

          <Card title="Timeline">
            <div className="mt-2 text-sm text-stone-500 space-y-1">
              <p>Created: {formatDateTime(order.createdAt)}</p>
              <p>Updated: {formatDateTime(order.updatedAt)}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
