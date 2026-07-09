"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category } from "@/types/room";
import type { Room } from "@/types/room";

export type RoomSortMode = "latest" | "closing" | "popular";

type LoadOptions = {
  showLoading?: boolean;
};

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [sortMode, setSortMode] = useState<RoomSortMode>("latest");
  const refreshingRef = useRef(false);

  const load = useCallback(async ({ showLoading = false }: LoadOptions = {}) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/rooms", { cache: "no-store" });
      if (!response.ok) return;

      const json = await response.json();
      setRooms(json.rooms ?? []);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const refreshFromSource = useCallback(async ({ showLoading = false }: LoadOptions = {}) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    if (showLoading) setLoading(true);
    try {
      await fetch("/api/ingest", { method: "POST" });
      await load();
    } catch {
      // Keep the current list visible; the next polling tick will retry.
    } finally {
      if (showLoading) setLoading(false);
      refreshingRef.current = false;
    }
  }, [load]);

  useEffect(() => {
    const initialize = async () => {
      await load({ showLoading: true });
      if (document.visibilityState === "visible") void refreshFromSource();
    };

    void initialize();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshFromSource();
    }, 10_000);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      return () => window.clearInterval(intervalId);
    }

    const channel = supabase
      .channel("rooms-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => load())
      .subscribe();
    return () => {
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [load, refreshFromSource]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rooms
      .filter((room) => {
        const categoryMatch = category === "all" || room.category === category;
        const queryMatch =
          !needle ||
          [room.title, room.destination, room.origin, ...(room.keywords ?? [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle);
        return categoryMatch && queryMatch;
      })
      .sort((a, b) => compareRooms(a, b, sortMode));
  }, [rooms, category, query, sortMode]);

  return { rooms: filtered, loading, query, setQuery, category, setCategory, sortMode, setSortMode, reload: refreshFromSource };
}

function compareRooms(a: Room, b: Room, sortMode: RoomSortMode) {
  if (sortMode === "closing") {
    const expireDiff = new Date(a.expire_at).getTime() - new Date(b.expire_at).getTime();
    if (expireDiff !== 0) return expireDiff;
    return compareByCreatedAt(a, b);
  }

  if (sortMode === "popular") {
    const peopleDiff = b.current_people - a.current_people;
    if (peopleDiff !== 0) return peopleDiff;
    const maxDiff = (b.max_people ?? 0) - (a.max_people ?? 0);
    if (maxDiff !== 0) return maxDiff;
    return compareBySourceMessage(a, b);
  }

  return compareBySourceMessage(a, b);
}

function compareByCreatedAt(a: Room, b: Room) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function compareBySourceMessage(a: Room, b: Room) {
  const aSourceId = Number(a.source_message_id);
  const bSourceId = Number(b.source_message_id);

  if (Number.isFinite(aSourceId) && Number.isFinite(bSourceId) && aSourceId !== bSourceId) {
    return bSourceId - aSourceId;
  }

  return compareByCreatedAt(a, b);
}
