"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Message } from "@/types/message";

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const response = await fetch(`/api/messages?roomId=${roomId}`, { cache: "no-store" });
      if (!response.ok) return;
      const json = await response.json();
      setMessages(json.messages ?? []);
    } finally {
      loadingRef.current = false;
    }
  }, [roomId]);

  useEffect(() => {
    void load();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 2_000);

    const supabase = getBrowserSupabase();
    if (!supabase) return () => window.clearInterval(intervalId);

    const channel = supabase
      .channel(`messages-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, load)
      .subscribe();

    return () => {
      window.clearInterval(intervalId);
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
