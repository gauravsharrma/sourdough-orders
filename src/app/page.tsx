import { db } from "@/db";
import { orders, products, orderItems } from "@/db/schema";
import { eq, sql, and, gte, lt } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString();

  // Today's orders
  const todayOrders = db
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, todayStr), lt(orders.createdAt, tomorrowStr)))
    .all();

  // Revenue today
  const todayRevenue = todayOrders
    .filter((o) => o.stripePaymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalInCents, 0);

  // Status breakdown
  const statusCounts: Partial<Record<OrderStatus, number>> = {};
  for (const o of todayOrders) {
    const s = o.status as OrderStatus;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  // Recent orders (last 10)
  const recentOrders = db
    .select()
    .from(orders)
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(10)
    .all();

  // Total products
  const productCount = db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isAvailable, 1))
    .get();

  // Weekly summary (last 7 days)
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekData: { day: string; count: number; revenue: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString();
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    const nextDStr = nextD.toISOString();
    const dayOrders = db
      .select()
      .from(orders)
      .where(and(gte(orders.createdAt, dStr), lt(orders.createdAt, nextDStr)))
      .all();
    weekData.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: dayOrders.length,
      revenue: dayOrders
        .filter((o) => o.stripePaymentStatus === "paid")
        .reduce((sum, o) => sum + o.totalInCents, 0),
    });
  }

  return (
    <div>
      <Header title="Dashboard" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <p className="text-sm text-stone-500">Orders Today</p>
          <p className="text-3xl font-bold mt-1">{todayOrders.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Revenue Today</p>
          <p className="text-3xl font-bold mt-1 text-green-700">
            {formatPrice(todayRevenue)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Active Products</p>
          <p className="text-3xl font-bold mt-1">{productCount?.count ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Needing Attention</p>
          <p className="text-3xl font-bold mt-1 text-amber-600">
            {(statusCounts.new ?? 0) + (statusCounts.confirmed ?? 0)}
          </p>
        </Card>
      </div>

      {/* Status Breakdown */}
      {todayOrders.length > 0 && (
        <div className="mt-6">
          <Card title="Today's Status Breakdown">
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <Badge
                    className={
                      ORDER_STATUS_COLORS[status as OrderStatus] ?? ""
                    }
                  >
                    {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
                  </Badge>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Weekly Overview */}
      <div className="mt-6">
        <Card title="This Week">
          <div className="flex items-end gap-2 h-32 mt-4">
            {weekData.map((d) => {
              const maxCount = Math.max(...weekData.map((x) => x.count), 1);
              const height = (d.count / maxCount) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-stone-500">{d.count}</span>
                  <div
                    className="w-full bg-amber-400 rounded-t"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-stone-500">{d.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="mt-6">
        <Card title="Recent Orders">
          {recentOrders.length === 0 ? (
            <p className="text-stone-400 mt-2">
              No orders yet. They&apos;ll appear here when customers order via WhatsApp.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-stone-100">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between py-3 hover:bg-stone-50 -mx-2 px-2 rounded"
                >
                  <div>
                    <span className="font-medium">#{order.id}</span>
                    <span className="text-stone-500 ml-2">
                      {order.customerName || order.customerPhone}
                    </span>
                    <span className="text-stone-400 text-sm ml-2">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {formatPrice(order.totalInCents)}
                    </span>
                    <Badge
                      className={
                        ORDER_STATUS_COLORS[order.status as OrderStatus] ?? ""
                      }
                    >
                      {ORDER_STATUS_LABELS[order.status as OrderStatus] ??
                        order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
