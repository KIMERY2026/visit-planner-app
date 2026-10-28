import type { Place, Visit } from "@prisma/client";
import { daysBetween, startOfToday } from "./dates";

const PRIORITY_WEIGHT: Record<string, number> = {
  HIGH: 1.4,
  MEDIUM: 1.0,
  LOW: 0.75,
};

export type Recommendation = {
  place: Place;
  score: number;
  reason: string;
};

/** Days since this place's most recent visit, or null if it has never been visited. */
export function lastVisitDays(place: Place, visits: Visit[]): number | null {
  const placeVisits = visits.filter((v) => v.placeId === place.id);
  if (placeVisits.length === 0) return null;
  const latest = placeVisits.reduce((max, v) => (v.date > max ? v.date : max), placeVisits[0].date);
  return daysBetween(new Date(latest), startOfToday());
}

export function statusFor(place: Place, visits: Visit[]): { tag: "never" | "overdue" | "ok"; label: string } {
  const days = lastVisitDays(place, visits);
  const interval = place.intervalDays || 30;
  if (days === null) return { tag: "never", label: "Never visited" };
  if (days > interval) return { tag: "overdue", label: `Overdue by ${days - interval}d` };
  return { tag: "ok", label: `Due in ${interval - days}d` };
}

/**
 * Recommendation score: how urgently a place needs a visit.
 * urgency = daysSinceLastVisit / targetIntervalDays (a never-visited place gets a flat high urgency)
 * score = urgency * priorityWeight
 * Higher score = more overdue, relative to its own target cadence, weighted by how important it is.
 */
export function scoreFor(place: Place, visits: Visit[]): { score: number; reason: string } {
  const days = lastVisitDays(place, visits);
  const interval = place.intervalDays || 30;
  const weight = PRIORITY_WEIGHT[place.priority] ?? 1.0;

  if (days === null) {
    return { score: 40 * weight, reason: "Never visited" };
  }
  const urgency = days / interval;
  const reason = days > interval ? `Overdue by ${days - interval}d` : `Due in ${interval - days}d`;
  return { score: urgency * weight, reason };
}

/** Rank every place not already excluded, best candidates first. */
export function recommend(places: Place[], visits: Visit[], excludeIds: Set<string>, count: number): Recommendation[] {
  return places
    .filter((p) => !excludeIds.has(p.id))
    .map((p) => {
      const { score, reason } = scoreFor(p, visits);
      return { place: p, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
