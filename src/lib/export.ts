import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney, summarize, TXN_META, type Transaction } from "./domain";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(title: string, rows: Transaction[]) {
  const header = [
    "Transaction ID",
    "Date",
    "Time",
    "Type",
    "Quantity",
    "Unit price",
    "Gross",
    "Airtime",
    "Net",
    "Employee %",
    "Employee amount",
    "Boss %",
    "Boss amount",
    "Notes",
  ];
  const lines = rows
    .filter((r) => !r.deleted_at)
    .map((r) =>
      [
        r.id,
        r.business_date,
        new Date(r.created_at).toLocaleTimeString(),
        TXN_META[r.transaction_type].label,
        r.quantity,
        r.unit_price,
        r.gross_amount,
        r.airtime_cost,
        r.net_amount,
        r.employee_percentage,
        r.employee_amount,
        r.boss_percentage,
        r.boss_amount,
        (r.notes ?? "").replace(/[\r\n",]+/g, " "),
      ].join(","),
    );
  const s = summarize(rows);
  lines.push("");
  lines.push(`TOTALS,,,,,,${s.gross},${s.airtime},${s.net},,${s.employee},,${s.boss},`);
  download(
    new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" }),
    `${title.replace(/\s+/g, "-").toLowerCase()}.csv`,
  );
}

export function exportPdf(title: string, subtitle: string, rows: Transaction[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  const s = summarize(rows);

  doc.setFontSize(18);
  doc.text("Mini Shop", 14, 16);
  doc.setFontSize(12);
  doc.text(title, 14, 24);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [["Date", "Type", "Qty", "Gross", "Airtime", "Net", "Employee", "Boss", "Notes"]],
    body: rows
      .filter((r) => !r.deleted_at)
      .map((r) => [
        r.business_date,
        TXN_META[r.transaction_type].label,
        String(r.quantity),
        formatMoney(Number(r.gross_amount)),
        formatMoney(Number(r.airtime_cost)),
        formatMoney(Number(r.net_amount)),
        formatMoney(Number(r.employee_amount)),
        formatMoney(Number(r.boss_amount)),
        r.notes ?? "",
      ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [190, 30, 45] },
    foot: [
      [
        "TOTAL",
        `${s.count} activities`,
        "",
        formatMoney(s.gross),
        formatMoney(s.airtime),
        formatMoney(s.net),
        formatMoney(s.employee),
        formatMoney(s.boss),
        "",
      ],
    ],
    footStyles: { fillColor: [40, 40, 40] },
  });

  doc.setFontSize(8);
  doc.text("Mini Shop — Developed by Chanel", 14, doc.internal.pageSize.getHeight() - 8);
  doc.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
