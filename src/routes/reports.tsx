import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { AppShell, StatCard } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useRealtime, useTransactions } from "@/lib/data";
import { exportCsv, exportPdf } from "@/lib/export";
import {
  formatMoney,
  presetRange,
  summarize,
  TXN_META,
  type RangePreset,
} from "@/lib/domain";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Mini Shop" },
      {
        name: "description",
        content:
          "Daily, weekly, monthly and yearly revenue reports with CSV and PDF export for Mini Shop.",
      },
      { property: "og:title", content: "Reports · Mini Shop" },
      {
        property: "og:description",
        content: "Revenue breakdowns and exportable reports for every period.",
      },
    ],
  }),
  component: Reports,
});

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This week" },
  { key: "last_week", label: "Last week" },
  { key: "this_month", label: "This month" },
  { key: "this_year", label: "This year" },
];

function Reports() {
  const [preset, setPreset] = useState<RangePreset>("this_month");
  const range = presetRange(preset);
  const q = useTransactions(range.from, range.to);
  useRealtime(["transactions"], ["transactions"]);

  const rows = q.data ?? [];
  const s = summarize(rows);
  const label = PRESETS.find((p) => p.key === preset)?.label ?? "Report";
  const subtitle = `${range.from} → ${range.to}`;

  return (
    <AppShell title="Reports" subtitle={subtitle}>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={p.key === preset ? "default" : "secondary"}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Gross" value={formatMoney(s.gross)} tone="sky" />
        <StatCard label="Airtime cost" value={formatMoney(s.airtime)} tone="muted" />
        <StatCard label="Net revenue" value={formatMoney(s.net)} />
        <StatCard label="Entries" value={String(s.count)} tone="muted" />
        <StatCard label="Employee share" value={formatMoney(s.employee)} tone="amber" />
        <StatCard label="Boss share" value={formatMoney(s.boss)} tone="sky" />
      </section>

      <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">By category</h2>
      <div className="space-y-2">
        {(Object.keys(TXN_META) as (keyof typeof TXN_META)[]).map((t) => (
          <div key={t} className="glass flex items-center gap-3 rounded-2xl p-3">
            <span className="text-xl">{TXN_META[t].emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{TXN_META[t].label}</p>
              <p className="text-xs text-muted-foreground">
                {s.byType[t].quantity} units · {s.byType[t].count} entries
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{formatMoney(s.byType[t].net)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          className="flex-1"
          disabled={rows.length === 0}
          onClick={() => exportCsv(`Mini Shop ${label}`, rows)}
        >
          <Download className="size-4" /> CSV
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={rows.length === 0}
          onClick={() => exportPdf(`Mini Shop ${label}`, subtitle, rows)}
        >
          <FileText className="size-4" /> PDF
        </Button>
      </div>

      {rows.length === 0 && !q.isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No transactions recorded for this period yet.
        </p>
      ) : null}
    </AppShell>
  );
}
