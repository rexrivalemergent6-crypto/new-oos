import { motion } from "framer-motion";
import { TreeStructure } from "@phosphor-icons/react";

// Merkle-root keygen animation shown while a new quantum vault is generated.
export default function KeygenAnimation() {
  const leaves = Array.from({ length: 8 });
  return (
    <div className="flex flex-col items-center py-4" data-testid="keygen-animation">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-quantum-purple">
        <TreeStructure weight="bold" className="h-4 w-4" />
        Merklizing WOTS pubkey
      </div>
      <div className="flex gap-1.5">
        {leaves.map((_, i) => (
          <motion.span
            key={i}
            className="h-8 w-2 bg-quantum-green/30"
            animate={{ scaleY: [0.3, 1, 0.3], backgroundColor: ["#14f19533", "#14F195", "#14f19533"] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.08 }}
            style={{ transformOrigin: "bottom" }}
          />
        ))}
      </div>
      <motion.div
        className="mt-2 h-[2px] bg-quantum-cyan"
        animate={{ width: ["10%", "80%", "40%"] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <motion.div
        className="mt-3 h-4 w-4 rounded-full bg-quantum-green glow-pulse"
        animate={{ scale: [0.8, 1.15, 0.8] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <p className="mt-3 font-plex-mono text-[11px] text-white/50">Deriving Keccak-256 merkle root → PDA</p>
    </div>
  );
}
