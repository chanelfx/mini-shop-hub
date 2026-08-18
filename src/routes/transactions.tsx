import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useDayClosure, useRealtime, useTransactions } from "@/lib/data";
import {
  formatMoney,
  TXN_META,
  TXN_TYPES,
  todayKey,
  type Transaction,
  type TxnType,
} from "@/lib/domain";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Record sales · Mini Shop" },
      {
        name: "description",
        content: "Capture SIM sales, swaps, movies and repairs with automatic revenue splitting.",
      },
      { property: "og:title", content: "Record sales · Mini Shop" },
      {
        property: "og:description",
        content: "Capture SIM sales, swaps, movies and repairs with automatic revenue splitting.",
      },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { user, isBoss } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isBoss) void router.navigate({ to: "/reports" });
  }, [isBoss, router]);
  const [date, setDate] = useState(todayKey());
  const [type, setType] = useState<TxnType>("new_sim");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [airtime, setAirtime] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");
  const [changes, setChanges] = useState("");

  const qc = useQueryClient();
  const list = useTransactions(date, date);
  const closure = useDayClosure(date);
  useRealtime(["transactions", "day_closures"], ["transactions", "day_closure"]);

  const meta = TXN_META[type];
  const gross = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const net = Math.max(0, gross - (meta.hasAirtime ? Number(airtime) || 0 : 0));
  const dayLocked = Boolean(closure.data);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (gross <= 0) {
      toast.error("Enter a quantity and price first");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      created_by: user.id,
      transaction_type: type,
      business_date: date,
      quantity: Number(quantity) || 0,
      unit_price: Number(unitPrice) || 0,
      gross_amount: gross,
      airtime_cost: meta.hasAirtime ? Number(airtime) || 0 : 0,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sale recorded");
    setQuantity("1");
    setUnitPrice("");
    setAirtime("");
    setNotes("");
    void qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  const requestEdit = async () => {
    if (!user || !editTarget) return;
    const { error } = await supabase.from("edit_requests").insert({
      transaction_id: editTarget.id,
      requested_by: user.id,
      reason: reason.trim(),
      requested_changes: changes.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Edit request sent to management");
    setEditTarget(null);
    setReason("");
    setChanges("");
    void qc.invalidateQueries({ queryKey: ["edit_requests"] });
  };

  const softDelete = async (t: Transaction) => {
    if (!user) return;
    const { error } = await supabase
      .from("transactions")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        deletion_reason: "Removed by user",
      })
      .eq("id", t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Entry removed");
    void qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  const rows = list.data ?? [];

  return (
    <AppShell title="Sales" subtitle="Record and review transactions">
      <form onSubmit={submit} className="glass rounded-3xl p-4">
        <div className="grid grid-cols-2 gap-2">
          {TXN_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-2xl border p-3 text-left transition ${
                type === t ? "border-primary bg-accent/60" : "border-border"
              }`}
            >
              <span className="text-lg">{TXN_META[t].emoji}</span>
              <span className="mt-1 block text-xs font-medium">{TXN_META[t].label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="date">Business date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qty">{meta.unitLabel}</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">{meta.priceLabel}</Label>
            <Input
              id="price"
              type="number"
              min="0"
              inputMode="decimal"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          {meta.hasAirtime ? (
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="airtime">Airtime cost (deducted before split)</Label>
              <Input
                id="airtime"
                type="number"
                min="0"
                inputMode="decimal"
                value={airtime}
                onChange={(e) => setAirtime(e.target.value)}
              />
            </div>
          ) : null}
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary px-3 py-2 text-sm">
          <span className="text-secondary-foreground">Gross {formatMoney(gross)}</span>
          <span className="font-semibold">Net {formatMoney(net)}</span>
        </div>

        <Button type="submit" className="mt-3 w-full" disabled={busy || dayLocked}>
          {dayLocked ? "Day closed — locked" : busy ? "Saving…" : "Save transaction"}
        </Button>
      </form>

      <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">
        Entries for {date} ({rows.length})
      </h2>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="glass rounded-2xl p-4 text-sm text-muted-foreground">
            No transactions recorded for this date yet.
          </p>
        ) : null}
        {rows.map((t) => (
          <div key={t.id} className="glass rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">{TXN_META[t.transaction_type].emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {TXN_META[t.transaction_type].label} · {t.quantity} ×{" "}
                  {formatMoney(Number(t.unit_price))}
                </p>
                <p className="text-xs text-muted-foreground">
                  Net {formatMoney(Number(t.net_amount))} · You{" "}
                  {formatMoney(Number(t.employee_amount))} · Boss{" "}
                  {formatMoney(Number(t.boss_amount))}
                </p>
              </div>
              {t.is_locked && !t.edit_unlocked ? (
                <Lock className="size-4 text-chart-3" />
              ) : null}
            </div>
            {t.notes ? <p className="mt-2 text-xs text-muted-foreground">{t.notes}</p> : null}
            <div className="mt-2 flex gap-2">
              {t.is_locked && !t.edit_unlocked && !isBoss ? (
                <Button size="sm" variant="secondary" onClick={() => setEditTarget(t)}>
                  <Pencil className="size-3.5" /> Request edit
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => void softDelete(t)}>
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(editTarget)} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request an edit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reason">Why does this need changing?</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="changes">What should it become?</Label>
              <Textarea id="changes" value={changes} onChange={(e) => setChanges(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void requestEdit()} disabled={!reason.trim()}>
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
