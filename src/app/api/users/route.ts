import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/users -> list users (newest first)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (data ?? []).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      createdAt: u.created_at,
    }));

    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users -> create user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim();
    const name = (body?.name ? String(body.name) : null) || null;

    if (!email) {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({ email, name })
      .select("id, email, name, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = {
      id: data.id,
      email: data.email,
      name: data.name ?? null,
      createdAt: data.created_at,
    };

    return NextResponse.json({ user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Не удалось создать пользователя" }, { status: 500 });
  }
}