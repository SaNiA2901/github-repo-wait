import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  try {
    // simple connectivity check using Drizzle/Turso
    await db.select().from(users).limit(1);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message ?? "DB error" }, { status: 500 });
  }
}