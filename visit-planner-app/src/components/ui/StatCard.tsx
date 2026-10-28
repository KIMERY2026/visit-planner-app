export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const toneClass =
    tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="bg-surface border border-line/15 rounded-2xl px-4 py-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`font-display text-3xl mt-1 num ${toneClass}`}>{value}</div>
    </div>
  );
}
