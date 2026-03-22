"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NEXT_STATUS_ACTION } from "@/lib/constants";
import type { OrderStatus } from "@/types";

export function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const action = NEXT_STATUS_ACTION[currentStatus];

  async function updateStatus(newStatus: OrderStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!action && currentStatus !== "new") return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {action && (
        <button
          onClick={() => updateStatus(action.next)}
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Updating..." : action.label}
        </button>
      )}
      {currentStatus !== "cancelled" && currentStatus !== "picked_up" && (
        <button
          onClick={() => updateStatus("cancelled")}
          disabled={loading}
          className="w-full rounded-lg bg-white border border-red-200 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          Cancel Order
        </button>
      )}
    </div>
  );
}
