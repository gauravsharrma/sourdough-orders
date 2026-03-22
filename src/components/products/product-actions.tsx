"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "./product-form";

interface ProductData {
  id: number;
  name: string;
  description: string | null;
  priceInCents: number;
  isAvailable: number;
}

export function ProductActions({ product }: { product: ProductData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return <ProductForm product={product} onClose={() => setEditing(false)} />;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-amber-600 hover:text-amber-800"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
