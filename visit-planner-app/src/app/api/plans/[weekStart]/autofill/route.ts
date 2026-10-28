import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { recommend } from "@/lib/scoring";

export async function POST(req: NextRequest, { params }: { params: { weekStart: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!permissions.canManagePlan(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const count = Math.max(1, Math.min(30, Number(body.count) || 10));
  const clearFirst = Boolean(body.clearFirst);
  const weekStartDate = new Date(params.weekStart);

  let plan = await prisma.weekPlan.findUnique({
    where: { weekStart: weekStartDate },
    include: { items: true },
  });
  if (!plan) {
    plan = await prisma.weekPlan.create({ data: { weekStart: weekStartDate }, include: { items: true } });
  }

  if (clearFirst) {
    const toRemove = plan.items.filter((i) => i.status !== "DONE").map((i) => i.id);
    if (toRemove.length) {
      await prisma.planItem.deleteMany({ where: { id: { in: toRemove } } });
    }
  }

  const remainingItems = clearFirst ? plan.items.filter((i) => i.status === "DONE") : plan.items;
  const excludeIds = new Set(remainingItems.map((i) => i.placeId));

  const places = await prisma.place.findMany();
  const visits = await prisma.visit.findMany();
  const picks = recommend(places, visits, excludeIds, count);

  await prisma.$transaction(
    picks.map((r, idx) =>
      prisma.planItem.create({
        data: {
          weekPlanId: plan!.id,
          placeId: r.place.id,
          day: idx % 5, // spread across Mon-Fri
          status: "PLANNED",
          reason: r.reason,
        },
      })
    )
  );

  const updated = await prisma.weekPlan.findUnique({
    where: { id: plan.id },
    include: { items: { include: { place: true } } },
  });
  return NextResponse.json(updated);
}
