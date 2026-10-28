import { prisma } from "@/lib/prisma";
import { lastVisitDays, statusFor, recommend } from "@/lib/scoring";
import { addDays, mondayOf, startOfToday, toISODate } from "@/lib/dates";
import { StatCard } from "@/components/ui/StatCard";
import { Pill, PriorityDot } from "@/components/ui/Pill";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [places, visits] = await Promise.all([prisma.place.findMany(), prisma.visit.findMany()]);

  const today = startOfToday();
  const monthKey = toISODate(today).slice(0, 7);
  const visitedThisMonthIds = new Set(
    visits.filter((v) => toISODate(new Date(v.date)).slice(0, 7) === monthKey).map((v) => v.placeId)
  );
  const neverVisited = places.filter((p) => lastVisitDays(p, visits) === null);
  const overdue = places.filter((p) => statusFor(p, visits).tag === "overdue");
  const everVisited = places.filter((p) => lastVisitDays(p, visits) !== null);
  const coverage = places.length ? Math.round((everVisited.length / places.length) * 100) : 0;

  const visitCount = (placeId: string) => visits.filter((v) => v.placeId === placeId).length;
  const mostVisited = places
    .map((p) => ({ p, c: visitCount(p.id) }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);
  const longestSince = places
    .map((p) => ({ p, days: lastVisitDays(p, visits) }))
    .filter((x) => x.days !== null)
    .sort((a, b) => (b.days as number) - (a.days as number))
    .slice(0, 5);

  const weeks = Array.from({ length: 8 }, (_, idx) => {
    const i = 7 - idx;
    const ws = toISODate(addDays(mondayOf(today), -7 * i));
    const we = toISODate(addDays(mondayOf(today), -7 * i + 6));
    const count = visits.filter((v) => {
      const d = toISODate(new Date(v.date));
      return d >= ws && d <= we;
    }).length;
    return { ws, count };
  });
  const maxCount = Math.max(1, ...weeks.map((w) => w.count));

  const attention = recommend(places, visits, new Set(), 5);

  const currentWeekStart = toISODate(mondayOf(today));
  const currentPlan = await prisma.weekPlan.findUnique({
    where: { weekStart: new Date(currentWeekStart) },
    include: { items: true },
  });
  const plannedCount = currentPlan?.items.filter((i) => i.status !== "SKIPPED").length ?? 0;

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted text-sm">
            {places.length} places tracked · {coverage}% ever visited
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total places" value={places.length} />
        <StatCard label="Visited this month" value={visitedThisMonthIds.size} tone="good" />
        <StatCard label="Overdue" value={overdue.length} tone="warn" />
        <StatCard label="Never visited" value={neverVisited.length} tone="danger" />
        <StatCard label="Planned this week" value={plannedCount} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-surface border border-line/15 rounded-2xl p-5 shadow-sm">
          <h2 className="font-display text-lg mb-3">Needs attention</h2>
          {attention.length === 0 && <p className="text-muted text-sm">No places yet — add some in Places.</p>}
          <div className="divide-y divide-line/10">
            {attention.map((r) => (
              <div key={r.place.id} className="flex items-center gap-2 py-2.5">
                <PriorityDot priority={r.place.priority} />
                <span className="flex-1 font-medium text-sm truncate">{r.place.name}</span>
                <Pill tone={r.reason === "Never visited" ? "danger" : r.reason.startsWith("Overdue") ? "warn" : "default"}>
                  {r.reason}
                </Pill>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-line/15 rounded-2xl p-5 shadow-sm">
          <h2 className="font-display text-lg mb-3">Visits per week</h2>
          <div className="flex items-end gap-1.5 h-16">
            {weeks.map((w) => (
              <div
                key={w.ws}
                className="flex-1 bg-accent rounded-t"
                style={{ height: `${Math.max(4, (w.count / maxCount) * 60)}px` }}
                title={`${w.count} visits, week of ${w.ws}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted mt-1.5">
            <span>8 wks ago</span>
            <span>this week</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-surface border border-line/15 rounded-2xl p-5 shadow-sm">
          <h2 className="font-display text-lg mb-3">Most visited</h2>
          {mostVisited.length === 0 && <p className="text-muted text-sm">No visits logged yet.</p>}
          <div className="divide-y divide-line/10">
            {mostVisited.map((x) => (
              <div key={x.p.id} className="flex justify-between py-2.5 text-sm">
                <span className="font-medium">{x.p.name}</span>
                <span className="num text-muted">{x.c} visits</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-line/15 rounded-2xl p-5 shadow-sm">
          <h2 className="font-display text-lg mb-3">Longest since last visit</h2>
          {longestSince.length === 0 && <p className="text-muted text-sm">Nothing logged yet.</p>}
          <div className="divide-y divide-line/10">
            {longestSince.map((x) => (
              <div key={x.p.id} className="flex justify-between py-2.5 text-sm">
                <span className="font-medium">{x.p.name}</span>
                <span className="num text-muted">{x.days}d ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
