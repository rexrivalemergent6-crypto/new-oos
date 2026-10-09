import { ShieldCheck, Warning } from "@phosphor-icons/react";

// Terminal-style quantum-safety disclosure banner.
export default function QuantumBanner({ compact = false }) {
  return (
    <div
      data-testid="quantum-banner"
      className="relative overflow-hidden border border-quantum-cyan/40 bg-black px-4 py-3 font-plex-mono text-[11px] leading-relaxed text-quantum-cyan/90"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scanline h-16 w-full bg-gradient-to-b from-transparent via-quantum-cyan/5 to-transparent" />
      </div>
      <div className="relative flex items-start gap-2">
        <ShieldCheck weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-quantum-green" />
        <div>
          <span className="text-quantum-green">quantum_safety.scope</span> → Payments rest in a
          per-invoice <b className="text-white">Winternitz (WOTS) vault</b>, resistant to Shor-style
          attacks <b className="text-white">at-rest during the settlement window</b>.
          {!compact && (
            <>
              {" "}
              <span className="inline-flex items-center gap-1 text-quantum-warning">
                <Warning weight="fill" className="h-3 w-3" />
                Research-grade &amp; unaudited
              </span>
              . SOL-only · mainnet · real funds. Ed25519 transport is <i>not</i> quantum-safe.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
