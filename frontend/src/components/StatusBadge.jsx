const MAP = {
  created: { label: "Awaiting Activation", cls: "text-white/60 border-white/20 bg-white/5" },
  active: { label: "Pending", cls: "text-quantum-warning border-quantum-warning/40 bg-quantum-warning/5" },
  underpaid: { label: "Underpaid", cls: "text-orange-400 border-orange-400/40 bg-orange-400/5" },
  paid: { label: "Paid", cls: "text-quantum-green border-quantum-green/40 bg-quantum-green/10" },
  overpaid: { label: "Overpaid", cls: "text-quantum-green border-quantum-green/40 bg-quantum-green/10" },
  settling: { label: "Settling", cls: "text-quantum-cyan border-quantum-cyan/40 bg-quantum-cyan/5" },
  settled: { label: "Settled", cls: "text-quantum-green border-quantum-green/60 bg-quantum-green/15" },
  expired: { label: "Expired", cls: "text-white/40 border-white/15 bg-white/5" },
};

export default function StatusBadge({ status, testid }) {
  const m = MAP[status] || MAP.created;
  const pulse = status === "active" || status === "settling";
  return (
    <span
      data-testid={testid || `status-${status}`}
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-plex-mono text-[10px] uppercase tracking-wider ${m.cls}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {m.label}
    </span>
  );
}
