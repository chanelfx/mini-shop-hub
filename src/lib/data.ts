import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction } from "./domain";

export function useTransactions(from: string, to: string) {
  return useQuery({
    queryKey: ["transactions", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("business_date", from)
        .lte("business_date", to)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Transaction[];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["business_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useDayClosure(date: string) {
  return useQuery({
    queryKey: ["day_closure", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("day_closures")
        .select("*")
        .eq("business_date", date)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEditRequests() {
  return useQuery({
    queryKey: ["edit_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edit_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Live invalidation for the tables that change during the working day. */
export function useRealtime(tables: string[], keys: string[]) {
  const qc = useQueryClient();
  const sig = tables.join(",");
  const keySig = keys.join(",");
  useEffect(() => {
    const channel = supabase.channel(`live:${sig}`);
    for (const table of sig.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const k of keySig.split(",")) void qc.invalidateQueries({ queryKey: [k] });
      });
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sig, keySig, qc]);
}
