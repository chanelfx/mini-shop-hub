import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { getSetupStatus, createInitialAccounts } from "@/lib/setup.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Mini Shop" },
      { name: "description", content: "Secure sign in for Mini Shop staff and management." },
      { property: "og:title", content: "Sign in · Mini Shop" },
      { property: "og:description", content: "Secure sign in for Mini Shop staff and management." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { theme, hasChosen, confirmChoice, setTheme } = useTheme();
  const { session, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; role: string }[]>([]);

  useEffect(() => {
    if (!loading && session) void router.navigate({ to: "/" });
  }, [loading, session, router]);

  useEffect(() => {
    void getSetupStatus().then((r) => setNeedsSetup(r.needsSetup)).catch(() => {});
  }, []);

  const runSetup = async () => {
    setBusy(true);
    try {
      const r = await createInitialAccounts();
      setCreated(r.accounts);
      setNeedsSetup(false);
      toast.success("Accounts created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  };


  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    void router.navigate({ to: "/" });
  };

  if (!hasChosen) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass w-full max-w-sm rounded-3xl p-6 text-center animate-rise">
          <h1 className="text-2xl font-bold text-gradient-primary">Choose your look</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a theme before signing in. You can change it any time.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`rounded-2xl border p-4 transition ${theme === "light" ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
            >
              <Sun className="mx-auto size-6 text-chart-3" />
              <span className="mt-2 block text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`rounded-2xl border p-4 transition ${theme === "dark" ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
            >
              <Moon className="mx-auto size-6 text-chart-2" />
              <span className="mt-2 block text-sm font-medium">Dark</span>
            </button>
          </div>
          <Button className="mt-6 w-full" onClick={() => confirmChoice(theme)}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={signIn} className="glass w-full max-w-sm rounded-3xl p-6 animate-rise">
        <div className="flex flex-col items-center text-center">
          <div className="gradient-primary flex size-14 items-center justify-center rounded-2xl">
            <Store className="size-7 text-primary-foreground" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">MINI SHOP</h1>
          <p className="text-xs text-muted-foreground">Developed by Chanel</p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        {needsSetup ? (
          <div className="mt-4 rounded-2xl bg-accent/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              No accounts exist yet. Create the Chanel and Boss accounts.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2 w-full"
              disabled={busy}
              onClick={() => void runSetup()}
            >
              Create accounts
            </Button>
          </div>
        ) : null}

        {created.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-accent/40 p-3 text-xs">
            <p className="font-semibold">Sign-in details</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {created.map((a) => (
                <li key={a.email}>
                  <span className="capitalize">{a.role}</span>: {a.email} / {a.password}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Accounts are created by management only.
        </p>

      </form>
    </div>
  );
}
