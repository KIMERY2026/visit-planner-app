import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

// action: "done" (logs a visit + marks done), "skip", "unskip", "undo" (reverses "done"), "remove"
export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body.action as string;
  const item = await prisma.planItem.findUnique({ where: { id: params.itemId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "done") {
    if (!permissions.canLogVisit(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const date = body.date ? new Date(body.date) : new Date();
    const visit = await prisma.visit.create({
      data: { placeId: item.placeId, date, note: body.note?.trim() || null, loggedById: session.user.id },
    });
    const updated = await prisma.planItem.update({
      where: { id: item.id },
      data: { status: "DONE", visitId: visit.id },
      include: { place: true },
    });
    return NextResponse.json(updated);
  }

  if (action === "skip" || action === "unskip") {
    if (!permissions.canManagePlan(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updated = await prisma.planItem.update({
      where: { id: item.id },
      data: { status: action === "skip" ? "SKIPPED" : "PLANNED" },
      include: { place: true },
    });
    return NextResponse.json(updated);
  }

  if (action === "undo") {
    if (!permissions.canManagePlan(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (item.visitId) {
      await prisma.planItem.update({ where: { id: item.id }, data: { visitId: null } });
      await prisma.visit.delete({ where: { id: item.visitId } });
    }
    const updated = await prisma.planItem.update({
      where: { id: item.id },
      data: { status: "PLANNED" },
      include: { place: true },
    });
    return NextResponse.json(updated);
  }

  if (action === "remove") {
    if (!permissions.canManagePlan(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.planItem.delete({ where: { id: item.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
