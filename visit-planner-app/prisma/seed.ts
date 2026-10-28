import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "mp@example.org" },
    update: {},
    create: { name: "The MP", email: "mp@example.org", passwordHash: password, role: "MP" },
  });
  await prisma.user.upsert({
    where: { email: "assistant@example.org" },
    update: {},
    create: { name: "Office Assistant", email: "assistant@example.org", passwordHash: password, role: "ASSISTANT" },
  });
  await prisma.user.upsert({
    where: { email: "staff@example.org" },
    update: {},
    create: { name: "Field Staff", email: "staff@example.org", passwordHash: password, role: "STAFF" },
  });

  const places = [
    { id: "ex_market", name: "Central Market (example)", category: "Market", ward: "Town Ward", priority: "HIGH" as const, intervalDays: 14 },
    { id: "ex_primary", name: "Riverside Primary School (example)", category: "School", ward: "Riverside Ward", priority: "MEDIUM" as const, intervalDays: 30 },
    { id: "ex_church", name: "St. Mary's Church (example)", category: "Church", ward: "Hillside Ward", priority: "MEDIUM" as const, intervalDays: 30 },
    { id: "ex_chief", name: "Chief's Camp (example)", category: "Government office", ward: "Town Ward", priority: "HIGH" as const, intervalDays: 21 },
    { id: "ex_youth", name: "Youth Resource Centre (example)", category: "Community centre", ward: "Riverside Ward", priority: "LOW" as const, intervalDays: 45 },
    { id: "ex_clinic", name: "Hillside Health Clinic (example)", category: "Clinic", ward: "Hillside Ward", priority: "MEDIUM" as const, intervalDays: 30 },
  ];

  for (const p of places) {
    await prisma.place.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, notes: "Example place — edit or delete this." },
    });
  }

  const visits: { id: string; placeId: string; date: string; note: string }[] = [
    { id: "ex_v1", placeId: "ex_market", date: "2026-10-20", note: "Example visit log." },
    { id: "ex_v2", placeId: "ex_market", date: "2026-09-18", note: "Example visit log." },
    { id: "ex_v3", placeId: "ex_primary", date: "2026-09-25", note: "Example visit log." },
    { id: "ex_v4", placeId: "ex_chief", date: "2026-10-01", note: "Example visit log." },
    { id: "ex_v5", placeId: "ex_clinic", date: "2026-08-15", note: "Example visit log." },
  ];

  for (const v of visits) {
    await prisma.visit.upsert({
      where: { id: v.id },
      update: {},
      create: { id: v.id, placeId: v.placeId, date: new Date(v.date), note: v.note },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
