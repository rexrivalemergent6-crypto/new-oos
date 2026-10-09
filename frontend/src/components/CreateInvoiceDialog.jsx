import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, CurrencyDollar } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";
import KeygenAnimation from "@/components/KeygenAnimation";
import api from "@/lib/api";

const EXPIRY_OPTS = [
  { v: 30, l: "30 min" }, { v: 60, l: "1 hr" }, { v: 240, l: "4 hr" }, { v: 1440, l: "24 hr" },
];

export default function CreateInvoiceDialog({ onCreated, solUsd }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [expiry, setExpiry] = useState(60);
  const [phase, setPhase] = useState("form"); // form | generating
  const [allowTips, setAllowTips] = useState(true);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitAddress, setSplitAddress] = useState("");
  const [splitType, setSplitType] = useState("percent");
  const [splitValue, setSplitValue] = useState("");

  const reset = () => {
    setAmount(""); setMemo(""); setExpiry(60); setPhase("form");
    setAllowTips(true); setSplitEnabled(false); setSplitAddress(""); setSplitType("percent"); setSplitValue("");
  };

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid SOL amount"); return; }
    const payload = { amount_sol: amt, memo, expiry_minutes: expiry, allow_tips: allowTips };
    if (splitEnabled) {
      const val = parseFloat(splitValue);
      if (!splitAddress.trim()) { toast.error("Enter a split payout address"); return; }
      if (!val || val <= 0) { toast.error("Enter a split amount"); return; }
      if (splitType === "percent" && val >= 100) { toast.error("Percent split must be < 100"); return; }
      payload.split_address = splitAddress.trim();
      payload.split_type = splitType;
      payload.split_value = val;
    }
    setPhase("generating");
    try {
      const [{ data }] = await Promise.all([
        api.post("/invoices", payload),
        new Promise((r) => setTimeout(r, 1600)),
      ]);
      toast.success("Quantum vault generated");
      onCreated?.(data);
      setOpen(false);
      setTimeout(reset, 300);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create invoice");
      setPhase("form");
    }
  };

  const usd = amount && solUsd ? (parseFloat(amount) * solUsd).toFixed(2) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 300); }}>
      <DialogTrigger asChild>
        <Button data-testid="new-invoice-btn"
          className="btn-sheen h-10 rounded-none bg-quantum-green px-5 font-mono text-sm font-bold text-black transition-transform hover:-translate-y-0.5 hover:bg-quantum-greenDark">
          <Plus weight="bold" className="mr-1.5 h-4 w-4" /> New invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-white/10 bg-quantum-ink">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-tight">Create invoice</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {phase === "form" ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4 py-2">
              <div>
                <Label className="font-plex-mono text-xs uppercase tracking-wider text-white/60">Amount (SOL)</Label>
                <div className="relative mt-1.5">
                  <Input data-testid="invoice-amount-input" type="number" step="0.0001" min="0"
                    value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.25"
                    className="rounded-none border-white/15 bg-black pr-16 font-mono text-lg" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-plex-mono text-xs text-white/40">SOL</span>
                </div>
                {usd && (
                  <p className="mt-1.5 flex items-center gap-1 font-plex-mono text-[11px] text-white/40">
                    <CurrencyDollar className="h-3 w-3" /> ≈ ${usd} USD (indicative)
                  </p>
                )}
              </div>
              <div>
                <Label className="font-plex-mono text-xs uppercase tracking-wider text-white/60">Memo</Label>
                <Textarea data-testid="invoice-memo-input" value={memo} onChange={(e) => setMemo(e.target.value)}
                  placeholder="Order #1234 — Latte" rows={2}
                  className="mt-1.5 resize-none rounded-none border-white/15 bg-black font-plex-mono text-sm" />
              </div>
              <div>
                <Label className="font-plex-mono text-xs uppercase tracking-wider text-white/60">Expires in</Label>
                <div className="mt-1.5 grid grid-cols-4 gap-px border border-white/10 bg-white/10">
                  {EXPIRY_OPTS.map((o) => (
                    <button key={o.v} data-testid={`expiry-${o.v}`} onClick={() => setExpiry(o.v)}
                      className={`bg-quantum-ink py-2 font-plex-mono text-xs transition-colors ${expiry === o.v ? "text-quantum-green" : "text-white/40 hover:text-white"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="flex items-center justify-between border border-white/10 p-3">
                <div>
                  <Label className="font-plex-mono text-xs uppercase tracking-wider text-white/70">Allow tips</Label>
                  <p className="text-[11px] text-white/40">Customer can add a tip at checkout</p>
                </div>
                <Switch data-testid="allow-tips-switch" checked={allowTips} onCheckedChange={setAllowTips} />
              </div>

              {/* Split payout */}
              <div className="border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-plex-mono text-xs uppercase tracking-wider text-white/70">Split payout</Label>
                    <p className="text-[11px] text-white/40">Send a share to a second wallet on settlement</p>
                  </div>
                  <Switch data-testid="split-toggle" checked={splitEnabled} onCheckedChange={setSplitEnabled} />
                </div>
                {splitEnabled && (
                  <div className="mt-3 space-y-2">
                    <Input data-testid="split-address-input" value={splitAddress}
                      onChange={(e) => setSplitAddress(e.target.value)} placeholder="Partner / staff SOL address"
                      className="rounded-none border-white/15 bg-black font-plex-mono text-xs" />
                    <div className="flex gap-2">
                      <div className="grid flex-1 grid-cols-2 gap-px border border-white/10 bg-white/10">
                        {["percent", "fixed"].map((t) => (
                          <button key={t} data-testid={`split-type-${t}`} onClick={() => setSplitType(t)}
                            className={`bg-quantum-ink py-2 font-plex-mono text-xs transition-colors ${splitType === t ? "text-quantum-purple" : "text-white/40 hover:text-white"}`}>
                            {t === "percent" ? "Percent %" : "Fixed SOL"}
                          </button>
                        ))}
                      </div>
                      <Input data-testid="split-value-input" type="number" step="0.01" min="0" value={splitValue}
                        onChange={(e) => setSplitValue(e.target.value)}
                        placeholder={splitType === "percent" ? "30" : "0.5"}
                        className="w-24 rounded-none border-white/15 bg-black font-mono text-sm" />
                    </div>
                  </div>
                )}
              </div>

              <Button data-testid="submit-invoice-btn" onClick={submit}
                className="w-full rounded-none bg-quantum-green font-mono font-bold text-black hover:bg-quantum-greenDark">
                Generate quantum vault
              </Button>
            </motion.div>
          ) : (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KeygenAnimation />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
