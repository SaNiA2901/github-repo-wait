import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.create({ data: { email, name } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}