import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { categoryMeta } from "@/lib/constants";

type TableResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

type RoomRow = {
  id: string;
  title: string;
  category: keyof typeof categoryMeta;
  status: string;
  source_message_id: string | null;
  owner_nickname: string | null;
  expire_at: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  room_id: string;
  nickname: string;
  content: string;
  created_at: string;
};

type IngestedChatRow = {
  id: number;
  sender: string | null;
  content: string;
  created_at: string | null;
  processed_at: string | null;
};

type AiLogRow = {
  id: string;
  source_chat_id: number | null;
  raw_message: string;
  action: string;
  room_id: string | null;
  created_at: string;
};

type ParticipantRow = {
  room_id: string;
  nickname: string;
  gender: "male" | "female" | "other";
  joined_at: string | null;
  updated_at: string | null;
};

export async function GET() {
  const supabase = getServerSupabase();

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      error: "supabase_not_configured",
      stats: emptyStats(),
      rooms: [],
      closingRooms: [],
      expiredRooms: [],
      chats: [],
      aiLogs: [],
      messages: [],
      participants: [],
      categories: categoryStats([]),
      settings: defaultSettings()
    });
  }

  const [roomsResult, chatsResult, aiLogsResult, messagesResult, participantsResult] = await Promise.all([
    supabase.from("rooms").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("ingested_chats").select("id,sender,content,created_at,processed_at").order("id", { ascending: false }).limit(300),
    supabase.from("ai_logs").select("id,source_chat_id,raw_message,action,room_id,created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("messages").select("id,room_id,nickname,content,created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("room_participants").select("room_id,nickname,gender,joined_at,updated_at").order("updated_at", { ascending: false }).limit(500)
  ]);

  const rooms = readRows<RoomRow>(roomsResult);
  const chats = readRows<IngestedChatRow>(chatsResult);
  const aiLogs = readRows<AiLogRow>(aiLogsResult);
  const messages = readRows<MessageRow>(messagesResult);
  const participants = readRows<ParticipantRow>(participantsResult);
  const now = Date.now();
  const closingWindowMs = 30 * 60 * 1000;
  const closingRooms = rooms.filter((room) => {
    const expireAt = new Date(room.expire_at).getTime();
    return room.status !== "expired" && expireAt > now && expireAt <= now + closingWindowMs;
  });
  const expiredRooms = rooms.filter((room) => room.status === "expired" || new Date(room.expire_at).getTime() <= now);

  return NextResponse.json({
    ok: true,
    errors: [roomsResult, chatsResult, aiLogsResult, messagesResult, participantsResult].map((result) => result.error?.message).filter(Boolean),
    stats: {
      rooms: rooms.length,
      activeRooms: rooms.filter((room) => room.status !== "expired" && new Date(room.expire_at).getTime() > now).length,
      closingRooms: closingRooms.length,
      expiredRooms: expiredRooms.length,
      sourceChats: chats.length,
      aiLogs: aiLogs.length,
      failedLogs: aiLogs.filter((log) => log.action === "skipped").length,
      messages: messages.length,
      participants: participants.length
    },
    rooms,
    closingRooms,
    expiredRooms,
    chats,
    aiLogs,
    messages,
    participants,
    categories: categoryStats(rooms),
    settings: defaultSettings()
  });
}

function emptyStats() {
  return {
    rooms: 0,
    activeRooms: 0,
    closingRooms: 0,
    expiredRooms: 0,
    sourceChats: 0,
    aiLogs: 0,
    failedLogs: 0,
    messages: 0,
    participants: 0
  };
}

function categoryStats(rooms: RoomRow[]) {
  return Object.entries(categoryMeta)
    .filter(([key]) => key !== "all")
    .map(([key, meta]) => ({
      category: key,
      label: meta.label,
      rooms: rooms.filter((room) => room.category === key).length
    }));
}

function defaultSettings() {
  return [
    { key: "room_ttl_hours", label: "방 유지 시간", value: "6시간" },
    { key: "closing_window", label: "폭파 임박 기준", value: "30분" },
    { key: "admin_nickname", label: "관리자 닉네임", value: "나스큐" }
  ];
}

function readRows<T>(result: TableResult<unknown>) {
  return result.error ? [] : (result.data ?? []) as T[];
}
