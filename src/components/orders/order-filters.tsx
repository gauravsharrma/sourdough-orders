"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/types";

export function OrderFilters({
  currentStatus,
  currentSearch,
}: {
  currentStatus: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/orders?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <select
        value={currentStatus}
        onChange={(e) => updateParams("status", e.target.value)}
        className="rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white"
      >
        <option value="all">All Statuses</option>
        {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Search by name or phone..."
        defaultValue={currentSearch}
        onChange={(e) => {
          clearTimeout((window as any).__searchTimeout);
          (window as any).__searchTimeout = setTimeout(
            () => updateParams("search", e.target.value),
            300
          );
        }}
        className="rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white flex-1 max-w-xs"
      />
    </div>
  );
}
