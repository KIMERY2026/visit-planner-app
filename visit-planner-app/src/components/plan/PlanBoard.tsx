"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Place, PlanItem, PlanStatus } from "@prisma/client";
import { addDays, DAY_NAMES, humanDate, mondayOf, parseISODate, startOfToday, toISODate, weekLabel } from "@/lib/dates";
import { Pill, PriorityDot } from "@/components/ui/Pill";

type ItemWithPlace = PlanItem & { place: Place | null };

export function PlanBoard({
  weekStart,
  places,
  canManage,
}: {
  weekStart: string;
  places: Place[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<ItemWithPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillCount, setFillCount] = useState(10);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/plans/${weekStart}`);
    const plan = await res.json();
    setItems(plan.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  function goToWeek(newWeek: string) {
    router.push(`/plan?week=${newWeek}`);
  }

  async function autoFill(clearFirst: boolean) {
    setBusy(true);
    await fetch(`/api/plans/${weekStart}/autofill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: fillCount, clearFirst }),
    });
    await load();
    setBusy(false);
  }

  async function addManual(placeId: string, day: number) {
    await fetch(`/api/plans/${weekStart}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, day }),
    });
    await load();
  }

  async function patchItem(itemId: string, body: Record<string, unknown>) {
    await fetch(`/api/plans/${weekStart}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  const byDay: ItemWithPlace[][] = Array.from({ length: 7 }, () => []);
  items.forEach((i) => {
    if (byDay[i.day]) byDay[i.day].push(i);
  });

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">This Week</h1>
          <p className="text-muted text-sm">{weekLabel(parseISODate(weekStart))}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => goToWeek(toISODate(addDays(parseISODate(weekStart), -7)))}>
            ← Prev
          </button>
          <button className="btn" onClick={() => goToWeek(toISODate(mondayOf(startOfToday())))}>
            Today
          </button>
          <button className="btn" onClick={() => goToWeek(toISODate(addDays(parseISODate(weekStart), 7)))}>
            Next →
          </button>
        </div>
      </div>

      {canManage && (
        <div className="bg-surface border border-line/15 rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="font-display text-lg mb-1">Plan my week</h2>
          <p className="text-muted text-sm mb-3">
            Tell it how many visits you want this week. The system will rank every place by how overdue it is and how
            high-priority it is, then fills Mon–Fri for you.
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Visits this week</label>
              <input
                type="number"
                min={1}
                max={30}
                value={fillCount}
                onChange={(e) => setFillCount(Number(e.target.value))}
                className="w-28 rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm"
              />
            </div>
            <button disabled={busy} onClick={() => autoFill(false)} className="btn-primary">
              Add recommended
            </button>
            <button disabled={busy} onClick={() => autoFill(true)} className="btn">
              Clear &amp; regenerate
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {DAY_NAMES.map((dn, idx) => (
            <div key={dn} className="bg-surface border border-line/15 rounded-2xl p-4 shadow-sm min-w-0">
              <h3 className="text-xs uppercase tracking-wide text-muted mb-2 flex justify-between">
                <span>{dn}</span>
                <span>{humanDate(addDays(parseISODate(weekStart), idx))}</span>
              </h3>
              {byDay[idx].length === 0 && <p className="text-muted text-xs py-2">Nothing planned</p>}
              <div className="space-y-2">
                {byDay[idx].map((item) => (
                  <PlanItemCard key={item.id} item={item} canManage={canManage} onAction={patchItem} />
                ))}
              </div>
              {canManage && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addManual(e.target.value, idx);
                      e.target.value = "";
                    }
                  }}
                  className="w-full mt-3 text-xs rounded-lg border border-dashed border-line/30 bg-bg px-2 py-1.5"
                >
                  <option value="">+ Add a place…</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .btn {
          border: 1px solid rgb(var(--line) / 0.2);
          background: rgb(var(--surface-2));
          color: rgb(var(--ink));
          border-radius: 9px;
          padding: 7px 12px;
          font-weight: 600;
          font-size: 13px;
        }
        .btn-primary {
          border: 1px solid transparent;
          background: rgb(var(--accent));
          color: white;
          border-radius: 9px;
          padding: 7px 14px;
          font-weight: 600;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

function PlanItemCard({
  item,
  canManage,
  onAction,
}: {
  item: ItemWithPlace;
  canManage: boolean;
  onAction: (id: string, body: Record<string, unknown>) => Promise<void>;
}) {
  const [logging, setLogging] = useState(false);
  const [date, setDate] = useState(toISODate(new Date()));

  const place = item.place;
  const status: PlanStatus = item.status;

  return (
    <div
      className={`border border-line/15 rounded-xl p-2.5 bg-bg ${
        status === "DONE" ? "opacity-70" : status === "SKIPPED" ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <PriorityDot priority={place?.priority ?? "MEDIUM"} />
        <span className="text-sm font-semibold truncate flex-1">{place?.name ?? "(deleted place)"}</span>
      </div>
      <div className="text-xs text-muted mt-0.5">{item.reason}</div>

      <div className="flex gap-1.5 mt-2 flex-wrap items-center">
        {status === "PLANNED" && (
          <>
            {logging ? (
              <div className="flex gap-1 items-center">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-xs rounded border border-line/20 px-1.5 py-1 w-[120px]"
                />
                <button
                  className="btn-primary !px-2 !py-1 !text-xs"
                  onClick={async () => {
                    await onAction(item.id, { action: "done", date });
                    setLogging(false);
                  }}
                >
                  Save
                </button>
                <button className="btn !px-2 !py-1 !text-xs" onClick={() => setLogging(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button className="btn-primary !px-2 !py-1 !text-xs" onClick={() => setLogging(true)}>
                  Log visit
                </button>
                {canManage && (
                  <>
                    <button className="btn !px-2 !py-1 !text-xs" onClick={() => onAction(item.id, { action: "skip" })}>
                      Skip
                    </button>
                    <button
                      className="btn !px-2 !py-1 !text-xs"
                      onClick={() => onAction(item.id, { action: "remove" })}
                    >
                      Remove
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
        {status === "SKIPPED" && (
          <>
            <Pill>Skipped</Pill>
            {canManage && (
              <button className="btn !px-2 !py-1 !text-xs" onClick={() => onAction(item.id, { action: "unskip" })}>
                Undo
              </button>
            )}
          </>
        )}
        {status === "DONE" && (
          <>
            <Pill tone="good">Logged</Pill>
            {canManage && (
              <button className="btn !px-2 !py-1 !text-xs" onClick={() => onAction(item.id, { action: "undo" })}>
                Undo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
