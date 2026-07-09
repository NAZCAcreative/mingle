"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Message } from "@/types/message";

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const load = useCallback(async () => {
    const response = await fetch(`/api/messages?roomId=${roomId}`, { cache: "no-store" });
    const json = await response.json();
    setMessages(json.messages ?? []);
  }, [roomId]);

  useEffect(() => {
    load();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`messages-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, roomId]);

  const send = async (nickname: string, content: string) => {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, nickname, content })
    });
    await load();
  };

  return { messages, send, reload: load };
}
