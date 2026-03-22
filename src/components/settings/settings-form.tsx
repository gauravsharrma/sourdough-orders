"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const updates = {
      business_name: form.get("business_name") as string,
      welcome_message: form.get("welcome_message") as string,
      pickup_hours: form.get("pickup_hours") as string,
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Business Settings">
      <form onSubmit={handleSubmit} className="mt-2 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Bakery Name
          </label>
          <input
            name="business_name"
            defaultValue={settings.business_name || ""}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Welcome Message
          </label>
          <textarea
            name="welcome_message"
            rows={3}
            defaultValue={settings.welcome_message || ""}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
          <p className="text-xs text-stone-400 mt-1">
            Sent to new customers on WhatsApp
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Pickup Hours
          </label>
          <input
            name="pickup_hours"
            defaultValue={settings.pickup_hours || ""}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </form>
    </Card>
  );
}
