"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Visit } from "@prisma/client";
import { humanDate } from "@/lib/dates";

type VisitWithPlace = Visit & { place: { name: string } };

export function HistoryManager({
  initialVisits,
  canDelete,
}: {
  initialVisits: VisitWithPlace[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () => initialVisits.filter((v) => v.place.name.toLowerCase().includes(search.toLowerCase())),
    [initialVisits, search]
  );

  async function deleteVisit(id: string) {
    await fetch(`/api/visits/${id}`, { method: "DELETE" });
    setConfirmingDelete(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Visit History</h1>
          <p className="text-muted text-sm">{initialVisits.length} visits logged</p>
        </div>
        <input
          className="rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm max-w-[220px]"
          placeholder="Search by place…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-surface border border-line/15 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted text-left">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Place</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-t border-line/10">
                <td className="px-4 py-2.5 num">{humanDate(new Date(v.date))}</td>
                <td className="px-4 py-2.5 font-medium">{v.place.name}</td>
                <td className="px-4 py-2.5 text-muted">{v.note || "—"}</td>
                <td className="px-4 py-2.5">
                  {canDelete && (
                    <button
                      className="text-xs font-semibold text-danger"
                      onClick={() => {
                        if (confirmingDelete === v.id) deleteVisit(v.id);
                        else {
                          setConfirmingDelete(v.id);
                          setTimeout(() => setConfirmingDelete((c) => (c === v.id ? null : c)), 4000);
                        }
                      }}
                    >
                      {confirmingDelete === v.id ? "Confirm?" : "Delete"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-muted text-sm p-4">No visits logged yet.</p>}
      </div>
    </div>
  );
}
