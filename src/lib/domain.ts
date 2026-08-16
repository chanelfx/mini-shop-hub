export type TxnType = "new_sim" | "sim_swap" | "movies_songs" | "phone_software";

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: TxnType;
  business_date: string;
  quantity: number;
  unit_price: number;
  gross_amount: number;
  airtime_cost: number;
  net_amount: number;
  employee_percentage: number;
  boss_percentage: number;
  employee_amount: number;
  boss_amount: number;
  notes: string | null;
  status: string;
  is_locked: boolean;
  edit_unlocked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
}

export const TXN_META: Record<
  TxnType,
  { label: string; emoji: string; unitLabel: string; priceLabel: string; hasAirtime: boolean }
> = {
  new_sim: {
    label: "New SIM",
    emoji: "📱",
    unitLabel: "SIM quantity",
    priceLabel: "Price per SIM",
    hasAirtime: true,
  },
  sim_swap: {
    label: "SIM Swap",
    emoji: "🔄",
    unitLabel: "Number of swaps",
    priceLabel: "Price per swap",
    hasAirtime: false,
  },
  movies_songs: {
    label: "Movies & Songs",
    emoji: "🎬",
    unitLabel: "Customers / items",
    priceLabel: "Price per item",
    hasAirtime: false,
  },
  phone_software: {
    label: "Phone Software",
    emoji: "💻",
    unitLabel: "Number of phones",
    priceLabel: "Price per service",
    hasAirtime: false,
  },
};

export const TXN_TYPES = Object.keys(TXN_META) as TxnType[];

export function formatMoney(value: number, currency = "RWF"): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ${currency}`;
}

export interface Summary {
  count: number;
  gross: number;
  airtime: number;
  net: number;
  employee: number;
  boss: number;
  byType: Record<TxnType, { count: number; quantity: number; gross: number; net: number }>;
}

export function summarize(rows: Transaction[]): Summary {
  const byType = TXN_TYPES.reduce(
    (acc, t) => {
      acc[t] = { count: 0, quantity: 0, gross: 0, net: 0 };
      return acc;
    },
    {} as Summary["byType"],
  );

  const s: Summary = { count: 0, gross: 0, airtime: 0, net: 0, employee: 0, boss: 0, byType };

  for (const r of rows) {
    if (r.deleted_at) continue;
    s.count += 1;
    s.gross += Number(r.gross_amount);
    s.airtime += Number(r.airtime_cost);
    s.net += Number(r.net_amount);
    s.employee += Number(r.employee_amount);
    s.boss += Number(r.boss_amount);
    const bucket = byType[r.transaction_type];
    if (bucket) {
      bucket.count += 1;
      bucket.quantity += Number(r.quantity);
      bucket.gross += Number(r.gross_amount);
      bucket.net += Number(r.net_amount);
    }
  }
  return s;
}

/** Local (device timezone) YYYY-MM-DD */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function startOfWeek(d: Date): Date {
  const c = new Date(d);
  const day = (c.getDay() + 6) % 7; // Monday start
  c.setDate(c.getDate() - day);
  return c;
}

export type RangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "this_year"
  | "custom";

export function presetRange(preset: RangePreset, now = new Date()): { from: string; to: string } {
  switch (preset) {
    case "today":
      return { from: toDateKey(now), to: toDateKey(now) };
    case "yesterday": {
      const y = addDays(now, -1);
      return { from: toDateKey(y), to: toDateKey(y) };
    }
    case "this_week": {
      const s = startOfWeek(now);
      return { from: toDateKey(s), to: toDateKey(addDays(s, 6)) };
    }
    case "last_week": {
      const s = addDays(startOfWeek(now), -7);
      return { from: toDateKey(s), to: toDateKey(addDays(s, 6)) };
    }
    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: toDateKey(s), to: toDateKey(e) };
    }
    case "this_year":
    default: {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31);
      return { from: toDateKey(s), to: toDateKey(e) };
    }
  }
}
