import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const places = await prisma.place.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(places);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!permissions.canEditPlaces(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const place = await prisma.place.create({
    data: {
      name: body.name.trim(),
      category: body.category?.trim() || null,
      ward: body.ward?.trim() || null,
      contact: body.contact?.trim() || null,
      priority: body.priority || "MEDIUM",
      intervalDays: Math.max(1, Number(body.intervalDays) || 30),
      notes: body.notes?.trim() || null,
    },
  });
  return NextResponse.json(place, { status: 201 });
}
