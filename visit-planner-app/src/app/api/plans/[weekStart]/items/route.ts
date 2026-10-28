import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

// Manually add one place to one day of the week's plan.
export async function POST(req: NextRequest, { params }: { params: { weekStart: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!permissions.canManagePlan(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { placeId, day } = body;
  if (!placeId || day === undefined) {
    return NextResponse.json({ error: "placeId and day are required" }, { status: 400 });
  }

  const weekStartDate = new Date(params.weekStart);
  let plan = await prisma.weekPlan.findUnique({ where: { weekStart: weekStartDate } });
  if (!plan) plan = await prisma.weekPlan.create({ data: { weekStart: weekStartDate } });

  const item = await prisma.planItem.create({
    data: { weekPlanId: plan.id, placeId, day: Number(day), status: "PLANNED", reason: "Added manually" },
    include: { place: true },
  });
  return NextResponse.json(item, { status: 201 });
}
