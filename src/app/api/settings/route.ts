import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allSettings = await db.select().from(settings).all();
    const map: Record<string, string> = {};
    for (const s of allSettings) {
      map[s.key] = s.value;
    }
    return NextResponse.json(map);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== "string") continue;
      const existing = await db.select().from(settings).where(eq(settings.key, key)).get();
      if (existing) {
        await db.update(settings).set({ value }).where(eq(settings.key, key)).run();
      } else {
        await db.insert(settings).values({ key, value }).run();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
