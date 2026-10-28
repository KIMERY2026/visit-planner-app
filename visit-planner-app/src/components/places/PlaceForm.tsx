"use client";

import { useState } from "react";
import type { Place } from "@prisma/client";

export type PlaceFormValues = {
  name: string;
  category: string;
  ward: string;
  priority: string;
  intervalDays: number;
  contact: string;
  notes: string;
};

export function PlaceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Place;
  onSave: (values: PlaceFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<PlaceFormValues>({
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    ward: initial?.ward ?? "",
    priority: initial?.priority ?? "MEDIUM",
    intervalDays: initial?.intervalDays ?? 30,
    contact: initial?.contact ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof PlaceFormValues>(key: K, val: PlaceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  return (
    <div className="border border-dashed border-line/30 rounded-xl p-4 mt-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Name">
          <input className="input" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Kamakwa Market" />
        </Field>
        <Field label="Category">
          <input className="input" value={values.category} onChange={(e) => set("category", e.target.value)} placeholder="Market, School, Church…" />
        </Field>
        <Field label="Ward / area">
          <input className="input" value={values.ward} onChange={(e) => set("ward", e.target.value)} />
        </Field>
        <Field label="Priority">
          <select className="input" value={values.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </Field>
        <Field label="Revisit every (days)">
          <input
            type="number"
            min={1}
            className="input"
            value={values.intervalDays}
            onChange={(e) => set("intervalDays", Number(e.target.value))}
          />
        </Field>
        <Field label="Contact">
          <input className="input" value={values.contact} onChange={(e) => set("contact", e.target.value)} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className="input min-h-[60px]" value={values.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <div className="flex gap-2 mt-3">
        <button
          disabled={saving || !values.name.trim()}
          className="btn-primary"
          onClick={async () => {
            setSaving(true);
            await onSave(values);
            setSaving(false);
          }}
        >
          {initial ? "Save changes" : "Add place"}
        </button>
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <style jsx global>{`
        .input {
          background: rgb(var(--bg));
          border: 1px solid rgb(var(--line) / 0.2);
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 13px;
          width: 100%;
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
        .btn:disabled,
        .btn-primary:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-2">
      <span className="block text-xs font-semibold text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
