import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, PlusCircle, TrendingUp } from "lucide-react";
import { AppShell, StatCard } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useDayClosure, useRealtime, useTransactions } from "@/lib/data";
import { formatMoney, summarize, TXN_META, todayKey, presetRange } from "@/lib/domain";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mini Shop · Daily dashboard" },
      {
        name: "description",
        content:
          "Track SIM sales, swaps, movies and phone software revenue with an automatic 40/60 split.",
      },
      { property: "og:title", content: "Mini Shop · Daily dashboard" },
      {
        property: "og:description",
        content: "Live shop revenue, splits and day-end locking for staff and management.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, isBoss } = useAuth();
  const today = todayKey();
  const month = presetRange("this_month");
  const day = useTransactions(today, today);
  const monthQ = useTransactions(month.from, month.to);
  const closure = useDayClosure(today);
  useRealtime(["transactions", "day_closures"], ["transactions", "day_closure"]);

  const d = summarize(day.data ?? []);
  const m = summarize(monthQ.data ?? []);

  return (
    <AppShell
      title={`Hello, ${profile?.full_name?.split(" ")[0] ?? "there"}`}
      subtitle={isBoss ? "Management overview" : "Today at Mini Shop"}
    >
      {closure.data ? (
        <div className="glass mb-4 flex items-center gap-2 rounded-2xl p-3 text-sm">
          <Lock className="size-4 text-chart-3" />
          Today is closed — records are locked.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Today gross" value={formatMoney(d.gross)} tone="sky" />
        <StatCard label="Today net" value={formatMoney(d.net)} />
        <StatCard
          label={isBoss ? "Boss share" : "Your share"}
          value={formatMoney(isBoss ? d.boss : d.employee)}
          tone="amber"
        />
        <StatCard label="Airtime cost" value={formatMoney(d.airtime)} tone="muted" />
      </section>

      <div className="mt-4 flex gap-2">
        {isBoss ? null : (
          <Button asChild className="flex-1">
            <Link to="/transactions">
              <PlusCircle className="size-4" /> Record a sale
            </Link>
          </Button>
        )}
        <Button asChild variant={isBoss ? "default" : "secondary"} className="flex-1">
          <Link to="/reports">
            <TrendingUp className="size-4" /> Reports
          </Link>
        </Button>
        {isBoss ? (
          <Button asChild variant="secondary" className="flex-1">
            <Link to="/messages">Chats</Link>
          </Button>
        ) : null}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">Today by category</h2>
      <div className="space-y-2">
        {(Object.keys(TXN_META) as (keyof typeof TXN_META)[]).map((t) => (
          <div key={t} className="glass flex items-center gap-3 rounded-2xl p-3">
            <span className="text-xl">{TXN_META[t].emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{TXN_META[t].label}</p>
              <p className="text-xs text-muted-foreground">
                {d.byType[t].quantity} units · {d.byType[t].count} entries
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{formatMoney(d.byType[t].net)}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">This month</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Net revenue" value={formatMoney(m.net)} />
        <StatCard label="Entries" value={String(m.count)} tone="sky" />
        <StatCard label="Employee share" value={formatMoney(m.employee)} tone="amber" />
        <StatCard label="Boss share" value={formatMoney(m.boss)} tone="muted" />
      </div>
    </AppShell>
  );
}
