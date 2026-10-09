import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Wallet, Vault, Lightning, ArrowRight, GithubLogo } from "@phosphor-icons/react";
import QuantumBackground from "@/components/QuantumBackground";
import QuantumBanner from "@/components/QuantumBanner";
import { useAuth } from "@/context/AuthContext";
import { ConfigContext } from "@/App";

const FEATURES = [
  { icon: Vault, title: "Per-invoice vault", body: "Every payment lands in a fresh Winternitz PDA derived from a one-time Keccak merkle root." },
  { icon: Lightning, title: "One-click settle", body: "Close the vault with a single-use WOTS signature; SOL sweeps straight to your Phantom wallet." },
  { icon: Wallet, title: "Phantom native", body: "Connect-and-sign auth. No passwords, no custody of your payout keys — ever." },
];

export default function Landing() {
  const { login, connecting, hasPhantom } = useAuth();
  const [err, setErr] = useState("");
  const cfg = ConfigContext.current;

  const handleConnect = async () => {
    setErr("");
    try {
      await login();
      toast.success("Wallet verified — welcome to QuantumPOS");
    } catch (e) {
      const msg = e?.message || "Connection failed";
      setErr(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-70">
        <QuantumBackground density={70} opacity={0.6} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 grid-tech opacity-40" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center bg-quantum-green">
              <Vault weight="fill" className="h-5 w-5 text-black" />
            </div>
            <span className="font-mono text-lg font-bold tracking-tighter">QuantumPOS</span>
          </div>
          <a href="https://github.com/blueshift-gg/solana-winternitz-vault" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 font-plex-mono text-xs text-white/50 transition-colors hover:text-quantum-green">
            <GithubLogo className="h-4 w-4" /> vault program
          </a>
        </header>

        <div className="flex flex-1 flex-col justify-center py-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 border border-quantum-purple/40 bg-quantum-purple/5 px-3 py-1 font-plex-mono text-[11px] uppercase tracking-[0.2em] text-quantum-purple">
              <span className="h-1.5 w-1.5 rounded-full bg-quantum-purple" /> Solana {cfg?.cluster || "mainnet-beta"} · live
            </div>
            <h1 className="font-mono text-5xl font-900 font-black leading-[0.95] tracking-tighter sm:text-6xl">
              Quantum-safe<br />
              <span className="text-quantum-green">crypto checkout</span><br />
              for merchants.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
              A point-of-sale where every SOL payment settles through a post-quantum Winternitz
              vault. Create an invoice, share a checkout link, and sweep funds to your Phantom wallet
              with a one-time hash-based signature.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                data-testid="phantom-connect-btn"
                onClick={handleConnect}
                disabled={connecting}
                className="btn-sheen group h-12 rounded-none bg-quantum-green px-7 font-mono text-sm font-bold text-black transition-transform hover:-translate-y-0.5 hover:bg-quantum-greenDark"
              >
                {connecting ? "Awaiting signature…" : "Connect Phantom"}
                <ArrowRight weight="bold" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              {!hasPhantom && (
                <a href="https://phantom.app/" target="_blank" rel="noreferrer"
                  data-testid="install-phantom-link"
                  className="font-plex-mono text-xs text-quantum-purple underline underline-offset-4">
                  Phantom not detected — install it →
                </a>
              )}
            </div>
            {err && <p data-testid="landing-error" className="mt-3 font-plex-mono text-xs text-red-400">{err}</p>}
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="bg-quantum-ink p-6">
                <f.icon weight="duotone" className="h-7 w-7 text-quantum-green" />
                <h3 className="mt-4 font-mono text-sm font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{f.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <QuantumBanner />
          </div>
        </div>
      </div>
    </div>
  );
}
