import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!permissions.canDeleteVisit(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Clear any plan item pointing at this visit first (it's a required-by-unique FK).
  await prisma.planItem.updateMany({
    where: { visitId: params.id },
    data: { visitId: null, status: "PLANNED" },
  });
  await prisma.visit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
