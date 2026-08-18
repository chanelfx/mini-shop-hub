import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useMessages, useProfiles, useRealtime } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Chat · Mini Shop" },
      {
        name: "description",
        content: "Internal messaging between shop staff and management, in real time.",
      },
      { property: "og:title", content: "Chat · Mini Shop" },
      {
        property: "og:description",
        content: "Real-time internal chat for Mini Shop staff and the boss.",
      },
    ],
  }),
  component: Messages,
});

function Messages() {
  const { user } = useAuth();
  const messages = useMessages();
  const profiles = useProfiles();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useRealtime(["messages"], ["messages"]);

  const rows = messages.data ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rows.length]);

  const nameOf = (id: string) =>
    (profiles.data ?? []).find((p) => (p as { id: string }).id === id)?.full_name ?? "Someone";

  const send = async () => {
    const body = text.trim();
    const receiver = (profiles.data ?? []).find(
      (p) => (p as { id: string }).id !== user?.id,
    ) as { id: string } | undefined;
    if (!body || !user || !receiver) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, receiver_id: receiver.id, message: body });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    void messages.refetch();
  };

  return (
    <AppShell title="Chat" subtitle="Shop team conversation">
      <div className="space-y-2">
        {rows.length === 0 && !messages.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello.
          </p>
        ) : null}
        {rows.map((m) => {
          const msg = m as { id: string; sender_id: string; message: string; created_at: string };
          const mine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`glass max-w-[80%] rounded-2xl px-3 py-2 ${
                  mine ? "bg-primary/15" : ""
                }`}
              >
                {!mine ? (
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {nameOf(msg.sender_id)}
                  </p>
                ) : null}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        className="glass sticky bottom-24 mt-4 flex items-center gap-2 rounded-2xl p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </AppShell>
  );
}
