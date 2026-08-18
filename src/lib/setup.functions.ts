import { createServerFn } from "@tanstack/react-start";

const ACCOUNTS = [
  {
    email: "chanel@minishop.app",
    password: "Chanel#2026",
    full_name: "Chanel",
    role: "employee" as const,
  },
  {
    email: "boss@minishop.app",
    password: "Boss#2026",
    full_name: "Boss",
    role: "boss" as const,
  },
];

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return { needsSetup: (count ?? 0) === 0 };
});

export const createInitialAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { created: false as const, accounts: [] };

  for (const a of ACCOUNTS) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: a.email,
      password: a.password,
      email_confirm: true,
      user_metadata: { full_name: a.full_name, role: a.role },
    });
    if (error && !error.message.toLowerCase().includes("already")) throw error;
  }

  return {
    created: true as const,
    accounts: ACCOUNTS.map((a) => ({ email: a.email, password: a.password, role: a.role })),
  };
});
