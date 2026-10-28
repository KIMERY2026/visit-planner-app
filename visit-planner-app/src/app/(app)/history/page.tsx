import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { HistoryManager } from "@/components/history/HistoryManager";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const visits = await prisma.visit.findMany({
    orderBy: { date: "desc" },
    include: { place: { select: { name: true } } },
  });

  return <HistoryManager initialVisits={visits} canDelete={permissions.canDeleteVisit(session!.user.role)} />;
}
