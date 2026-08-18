import { createFileRoute } from "@tanstack/react-router";
import { Bell, ClipboardList, Moon, ShieldCheck, Sun, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useAuditLogs, useEditRequests, useNotifications, useProfiles, useSettings } from "@/lib/data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "More · Mini Shop" },
      {
        name: "description",
        content: "Account, revenue split settings, edit requests, notifications and audit trail.",
      },
      { property: "og:title", content: "More · Mini Shop" },
      {
        property: "og:description",
        content: "Manage your Mini Shop account, split settings and activity history.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, isBoss, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const profiles = useProfiles();
  const requests = useEditRequests();
  const notifications = useNotifications();
  const logs = useAuditLogs();

  const split = settings.data as { employee_percentage?: number; boss_percentage?: number } | null;

  return (
    <AppShell title="More" subtitle={profile?.full_name ?? ""}>
      <section className="glass rounded-2xl p-4">
        <p className="text-sm font-semibold">{profile?.full_name}</p>
        <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </section>

      <section className="glass mt-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" /> Revenue split
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Applied to net revenue after airtime cost is deducted.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-accent/40 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Employee</p>
            <p className="text-lg font-semibold tabular-nums">{split?.employee_percentage ?? 40}%</p>
          </div>
          <div className="rounded-xl bg-accent/40 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Boss</p>
            <p className="text-lg font-semibold tabular-nums">{split?.boss_percentage ?? 60}%</p>
          </div>
        </div>
      </section>

      {isBoss ? (
        <section className="glass mt-3 rounded-2xl p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-chart-2" /> Team
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {(profiles.data ?? []).map((p) => {
              const row = p as { id: string; full_name: string; role: string };
              return (
                <li key={row.id} className="flex justify-between">
                  <span>{row.full_name}</span>
                  <span className="text-xs capitalize text-muted-foreground">{row.role}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="glass mt-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="size-4 text-chart-3" /> Edit requests
        </p>
        {(requests.data ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No edit requests.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {(requests.data ?? []).map((r) => {
              const row = r as { id: string; reason: string; status: string };
              return (
                <li key={row.id} className="flex justify-between gap-3">
                  <span className="truncate">{row.reason}</span>
                  <span className="text-xs capitalize text-muted-foreground">{row.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="glass mt-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="size-4 text-chart-2" /> Notifications
        </p>
        {(notifications.data ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Nothing new.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {(notifications.data ?? []).slice(0, 10).map((n) => {
              const row = n as { id: string; title: string; created_at: string };
              return (
                <li key={row.id} className="flex justify-between gap-3">
                  <span className="truncate">{row.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isBoss ? (
        <section className="glass mt-3 rounded-2xl p-4">
          <p className="text-sm font-semibold">Audit log</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {(logs.data ?? []).slice(0, 20).map((l) => {
              const row = l as { id: string; action: string; created_at: string };
              return (
                <li key={row.id}>
                  {new Date(row.created_at).toLocaleString()} — {row.action}
                </li>
              );
            })}
            {(logs.data ?? []).length === 0 ? <li>No activity yet.</li> : null}
          </ul>
        </section>
      ) : null}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Mini Shop · Developed by Chanel
      </p>
    </AppShell>
  );
}
