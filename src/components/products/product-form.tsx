"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProductForm({
  product,
  onClose,
}: {
  product?: {
    id: number;
    name: string;
    description: string | null;
    priceInCents: number;
    isAvailable: number;
  };
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!product;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const body = {
      name: form.get("name") as string,
      description: (form.get("description") as string) || null,
      priceInCents: Math.round(parseFloat(form.get("price") as string) * 100),
      isAvailable: form.get("isAvailable") === "on" ? 1 : 0,
    };

    try {
      const url = isEdit ? `/api/products/${product.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setOpen(false);
        onClose?.();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isEdit && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700"
      >
        + Add Product
      </button>
    );
  }

  return (
    <div className={isEdit ? "" : "fixed inset-0 bg-black/30 flex items-center justify-center z-50"}>
      <div className={isEdit ? "" : "bg-white rounded-xl p-6 w-full max-w-md shadow-xl"}>
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Product" : "New Product"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Name
            </label>
            <input
              name="name"
              required
              defaultValue={product?.name ?? ""}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description
            </label>
            <input
              name="description"
              defaultValue={product?.description ?? ""}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Price ($)
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product ? (product.priceInCents / 100).toFixed(2) : ""}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              name="isAvailable"
              type="checkbox"
              defaultChecked={product ? !!product.isAvailable : true}
              className="rounded"
            />
            <label className="text-sm text-stone-700">Available for ordering</label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
