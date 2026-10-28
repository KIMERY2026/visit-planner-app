import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { PlacesManager } from "@/components/places/PlacesManager";

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const session = await getServerSession(authOptions);
  const [places, visits] = await Promise.all([
    prisma.place.findMany({ orderBy: { name: "asc" } }),
    prisma.visit.findMany(),
  ]);

  return (
    <PlacesManager
      initialPlaces={places}
      visits={visits}
      canEdit={permissions.canEditPlaces(session!.user.role)}
      canDelete={permissions.canDeletePlaces(session!.user.role)}
    />
  );
}
