import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const visits = await prisma.visit.findMany({
    orderBy: { date: "desc" },
    include: { place: { select: { name: true } } },
  });
  return NextResponse.json(visits);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.placeId || !body.date) {
    return NextResponse.json({ error: "placeId and date are required" }, { status: 400 });
  }

  const visit = await prisma.visit.create({
    data: {
      placeId: body.placeId,
      date: new Date(body.date),
      note: body.note?.trim() || null,
      loggedById: session.user.id,
    },
  });
  return NextResponse.json(visit, { status: 201 });
}
