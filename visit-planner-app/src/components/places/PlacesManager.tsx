"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Place, Visit } from "@prisma/client";
import { statusFor, lastVisitDays } from "@/lib/scoring";
import { humanDate } from "@/lib/dates";
import { Pill, PriorityDot } from "@/components/ui/Pill";
import { PlaceForm, type PlaceFormValues } from "./PlaceForm";

export function PlacesManager({
  initialPlaces,
  visits,
  canEdit,
  canDelete,
}: {
  initialPlaces: Place[];
  visits: Visit[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () => initialPlaces.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [initialPlaces, search]
  );

  async function createPlace(values: PlaceFormValues) {
    await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setShowAdd(false);
    router.refresh();
  }

  async function updatePlace(id: string, values: PlaceFormValues) {
    await fetch(`/api/places/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditingId(null);
    router.refresh();
  }

  async function deletePlace(id: string) {
    await fetch(`/api/places/${id}`, { method: "DELETE" });
    setConfirmingDelete(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Places</h1>
          <p className="text-muted text-sm">{initialPlaces.length} in catalogue</p>
        </div>
        <input
          className="input max-w-[220px]"
          placeholder="Search places…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {canEdit && (
        <div className="bg-surface border border-line/15 rounded-2xl p-4 shadow-sm mb-4">
          <button className="btn-primary" onClick={() => setShowAdd((s) => !s)}>
            + Add a place
          </button>
          {showAdd && <PlaceForm onSave={createPlace} onCancel={() => setShowAdd(false)} />}
        </div>
      )}

      <div className="bg-surface border border-line/15 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted text-left">
              <th className="px-4 py-2">Place</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Interval</th>
              <th className="px-4 py-2">Last visit</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const last = lastVisitDays(p, visits);
              const s = statusFor(p, visits);
              const tone = s.tag === "never" ? "danger" : s.tag === "overdue" ? "warn" : "good";
              return (
                <Fragment key={p.id}>
                  <tr className="border-t border-line/10">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold">{p.name}</div>
                      {p.ward && <div className="text-xs text-muted">{p.ward}</div>}
                    </td>
                    <td className="px-4 py-2.5">{p.category || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <PriorityDot priority={p.priority} /> {p.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 num">{p.intervalDays}d</td>
                    <td className="px-4 py-2.5 num">{last !== null ? `${last}d ago` : "—"}</td>
                    <td className="px-4 py-2.5">
                      <Pill tone={tone as any}>{s.label}</Pill>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {canEdit && (
                        <button className="btn !px-2 !py-1 !text-xs mr-1" onClick={() => setEditingId(p.id)}>
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="btn !px-2 !py-1 !text-xs text-danger"
                          onClick={() => {
                            if (confirmingDelete === p.id) deletePlace(p.id);
                            else {
                              setConfirmingDelete(p.id);
                              setTimeout(() => setConfirmingDelete((c) => (c === p.id ? null : c)), 4000);
                            }
                          }}
                        >
                          {confirmingDelete === p.id ? "Confirm?" : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {editingId === p.id && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-3">
                        <PlaceForm initial={p} onSave={(v) => updatePlace(p.id, v)} onCancel={() => setEditingId(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-muted text-sm p-4">No places match.</p>}
      </div>

      <style jsx global>{`
        .input {
          background: rgb(var(--bg));
          border: 1px solid rgb(var(--line) / 0.2);
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 13px;
        }
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
