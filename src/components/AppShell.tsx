import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  Home,
  LogOut,
  MessageSquare,
  Moon,
  Receipt,
  Settings,
  Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

const EMPLOYEE_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/transactions", label: "Sales", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/messages", label: "Chat", icon: MessageSquare },
  { to: "/settings", label: "More", icon: Settings },
] as const;

const BOSS_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/messages", label: "Chat", icon: MessageSquare },
  { to: "/settings", label: "More", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { profile, signOut, loading, session, isBoss } = useAuth();
  const nav: readonly { to: string; label: string; icon: typeof Home }[] = isBoss
    ? BOSS_NAV
    : EMPLOYEE_NAV;
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) void router.navigate({ to: "/auth" });
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="glass sticky top-0 z-30 rounded-b-3xl px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {subtitle ?? `${profile?.full_name ?? "…"} · ${profile?.role ?? ""}`}
            </p>
          </div>
          {action}
          <Button
            size="icon"
            variant="ghost"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" aria-label="Sign out" onClick={() => void signOut()}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl animate-rise px-4 py-4">{children}</main>

      <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-30 rounded-t-3xl px-2 pt-2">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to as "/"}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition-colors"
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "text-primary bg-accent/60" }}
            >
              <n.icon className="size-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "sky" | "amber" | "muted";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "sky"
        ? "text-chart-2"
        : tone === "amber"
          ? "text-chart-3"
          : "text-foreground";
  return (
    <div className="glass rounded-2xl p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
