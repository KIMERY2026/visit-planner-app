import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrCreatePlan(weekStart: string) {
  const date = new Date(weekStart);
  let plan = await prisma.weekPlan.findUnique({
    where: { weekStart: date },
    include: { items: { include: { place: true } } },
  });
  if (!plan) {
    plan = await prisma.weekPlan.create({
      data: { weekStart: date },
      include: { items: { include: { place: true } } },
    });
  }
  return plan;
}

export async function GET(_req: Request, { params }: { params: { weekStart: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getOrCreatePlan(params.weekStart);
  return NextResponse.json(plan);
}
