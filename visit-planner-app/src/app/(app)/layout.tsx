import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NavRail } from "@/components/nav/NavRail";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="flex">
      <NavRail userName={session.user.name ?? ""} role={session.user.role} />
      <main className="flex-1 min-w-0 px-5 py-7 md:px-10 md:py-9 pb-24 md:pb-9 max-w-6xl">{children}</main>
    </div>
  );
}
