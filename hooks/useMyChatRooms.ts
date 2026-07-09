"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Message } from "@/types/message";
import type { Room } from "@/types/room";

export type JoinedRoom = {
  id: string;
  title: string;
  expire_at: string;
  last_message_at: string;
  last_read_at?: string;
};

export type ChatAlertRoom = JoinedRoom & {
  unreadCount: number;
  latestMessage?: Message;
};

const key = "mingle_joined_rooms";
const eventName = "mingle_joined_rooms_changed";

function emitChange() {
  window.dispatchEvent(new Event(eventName));
}

function toJoinedRoom(room: Room, previous?: JoinedRoom): JoinedRoom {
  return {
    id: room.id,
    title: room.title,
    expire_at: room.expire_at,
    last_message_at: room.last_message_at,
    last_read_at: previous?.last_read_at
  };
}

function readJoinedRooms() {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as JoinedRoom[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((room) => room.id && room.title);
  } catch {
    return [];
  }
}

function writeJoinedRooms(rooms: JoinedRoom[]) {
  localStorage.setItem(key, JSON.stringify(rooms));
  emitChange();
}

export function saveJoinedRoom(room: Room) {
  const rooms = readJoinedRooms();
  const previous = rooms.find((item) => item.id === room.id);
  const nextRoom = toJoinedRoom(room, previous);
  writeJoinedRooms([nextRoom, ...rooms.filter((item) => item.id !== room.id)]);
}

export function removeJoinedRoom(roomId: string) {
  writeJoinedRooms(readJoinedRooms().filter((room) => room.id !== roomId));
}

export function markJoinedRoomRead(room: Room, lastReadAt?: string) {
  const rooms = readJoinedRooms();
  const previous = rooms.find((item) => item.id === room.id);
  const nextRoom = {
    ...toJoinedRoom(room, previous),
    last_read_at: lastReadAt ?? previous?.last_read_at ?? new Date().toISOString()
  };
  writeJoinedRooms([nextRoom, ...rooms.filter((item) => item.id !== room.id)]);
}

export function useMyChatRooms(nickname: string) {
  const [rooms, setRooms] = useState<JoinedRoom[]>([]);
  const [alerts, setAlerts] = useState<ChatAlertRoom[]>([]);

  const loadRooms = useCallback(() => {
    const now = Date.now();
    const nextRooms = readJoinedRooms().filter((room) => new Date(room.expire_at).getTime() > now);
    setRooms(nextRooms);
    return nextRooms;
  }, []);

  const refreshAlerts = useCallback(async () => {
    const currentRooms = loadRooms();
    const nextAlerts = await Promise.all(
      currentRooms.map(async (room) => {
        try {
          const response = await fetch(`/api/messages?roomId=${room.id}`, { cache: "no-store" });
          if (!response.ok) return { ...room, unreadCount: 0 };
          const json = await response.json();
          const messages = (json.messages ?? []) as Message[];
          const lastReadAt = room.last_read_at ? new Date(room.last_read_at).getTime() : 0;
          const unreadCount = messages.filter((message) => {
            if (nickname && message.nickname === nickname) return false;
            return new Date(message.created_at).getTime() > lastReadAt;
          }).length;
          return { ...room, unreadCount, latestMessage: messages.at(-1) };
        } catch {
          return { ...room, unreadCount: 0 };
        }
      })
    );

    setAlerts(nextAlerts);
  }, [loadRooms, nickname]);

  useEffect(() => {
    void refreshAlerts();

    const onChange = () => void refreshAlerts();
    window.addEventListener(eventName, onChange);
    window.addEventListener("storage", onChange);
    const intervalId = window.setInterval(refreshAlerts, 10_000);

    return () => {
      window.removeEventListener(eventName, onChange);
      window.removeEventListener("storage", onChange);
      window.clearInterval(intervalId);
    };
  }, [refreshAlerts]);

  const unreadTotal = useMemo(() => alerts.reduce((sum, room) => sum + room.unreadCount, 0), [alerts]);

  return { rooms, alerts, unreadTotal, refreshAlerts };
}
