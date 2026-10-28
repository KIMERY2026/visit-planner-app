import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mondayOf, startOfToday, toISODate } from "@/lib/dates";
import { permissions } from "@/lib/permissions";
import { PlanBoard } from "@/components/plan/PlanBoard";

export const dynamic = "force-dynamic";

export default async function PlanPage({ searchParams }: { searchParams: { week?: string } }) {
  const session = await getServerSession(authOptions);
  const weekStart = searchParams.week || toISODate(mondayOf(startOfToday()));

  const places = await prisma.place.findMany({ orderBy: { name: "asc" } });

  return <PlanBoard weekStart={weekStart} places={places} canManage={permissions.canManagePlan(session!.user.role)} />;
}
