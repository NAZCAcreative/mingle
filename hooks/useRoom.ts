"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Room } from "@/types/room";

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const response = await fetch(`/api/rooms?roomId=${roomId}`, { cache: "no-store" });
    const json = await response.json();
    setRoom(json.room ?? null);
    setLoading(false);
  }, [roomId]);
  useEffect(() => {
    load();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, roomId]);
  return { room, loading, reload: load };
}
