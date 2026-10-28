import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!permissions.canEditPlaces(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const place = await prisma.place.update({
    where: { id: params.id },
    data: {
      name: body.name?.trim(),
      category: body.category?.trim() || null,
      ward: body.ward?.trim() || null,
      contact: body.contact?.trim() || null,
      priority: body.priority,
      intervalDays: body.intervalDays ? Math.max(1, Number(body.intervalDays)) : undefined,
      notes: body.notes?.trim() || null,
    },
  });
  return NextResponse.json(place);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!permissions.canDeletePlaces(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.place.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
