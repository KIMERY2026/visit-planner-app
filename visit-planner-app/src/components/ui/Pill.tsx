export function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "danger" }) {
  const toneClass =
    tone === "good"
      ? "text-good border-good/40 bg-good/10"
      : tone === "warn"
      ? "text-warn border-warn/40 bg-warn/10"
      : tone === "danger"
      ? "text-danger border-danger/40 bg-danger/10"
      : "text-muted border-line/20";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${toneClass}`}>
      {children}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const color = priority === "HIGH" ? "bg-danger" : priority === "LOW" ? "bg-good" : "bg-warn";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />;
}
