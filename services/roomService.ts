import { addRoomTtl } from "@/lib/time";
import { getServerSupabase } from "@/lib/supabase/server";
import { cleanRoomTitle } from "@/lib/title";
import { getLocalRoom, joinLocalRoom, listLocalActiveRooms, registerLocalRoomOwner, upsertLocalRoomFromAnalysis } from "@/services/localStore";
import type { AiAnalysis } from "@/types/ai";
import type { Room } from "@/types/room";

export async function listActiveRooms(): Promise<Room[]> {
  const supabase = getServerSupabase();
  if (!supabase) return listLocalActiveRooms();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .neq("status", "expired")
    .gt("expire_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const supabase = getServerSupabase();
  if (!supabase) return getLocalRoom(roomId);
  const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function expireRooms() {
  const supabase = getServerSupabase();
  if (!supabase) return { expired: 0 };
  const { data, error } = await supabase
    .from("rooms")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .lt("expire_at", new Date().toISOString())
    .neq("status", "expired")
    .select("id");
  if (error) throw error;
  return { expired: data?.length ?? 0 };
}

export async function upsertRoomFromAnalysis(analysis: AiAnalysis, sourceMessageId?: string, kakaoSender?: string | null) {
  const supabase = getServerSupabase();
  if (!analysis.is_actionable || analysis.type === "ignore") return null;
  if (!supabase) return upsertLocalRoomFromAnalysis(analysis, sourceMessageId, kakaoSender);
  const now = new Date();

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      title: cleanRoomTitle(analysis.title),
      category: analysis.category,
      summary: analysis.summary,
      origin: analysis.origin,
      destination: analysis.destination,
      meeting_time_text: analysis.meeting_time_text,
      current_people: analysis.current_people,
      max_people: analysis.max_people,
      status: analysis.type === "question" ? "answering" : "open",
      merge_key: analysis.merge_key,
      keywords: analysis.keywords,
      source_message_id: sourceMessageId,
      kakao_sender: kakaoSender ?? null,
      owner_nickname: null,
      last_message_at: now.toISOString(),
      expire_at: addRoomTtl(now).toISOString()
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Room;
}

export async function joinRoom(roomId: string, nickname: string, gender: "male" | "female" | "other") {
  const supabase = getServerSupabase();
  if (!supabase) return joinLocalRoom(roomId, nickname, gender);

  return getRoom(roomId);
}

export async function registerRoomOwner(roomId: string, nickname: string) {
  const supabase = getServerSupabase();
  if (!supabase) return registerLocalRoomOwner(roomId, nickname);

  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "room_not_found" };
  if (room.owner_nickname) return { ok: true, room };

  const sourceId = Number(room.source_message_id);
  if (!sourceId) return { ok: false, error: "missing_source_sender" };

  const { data: source, error: sourceError } = await supabase
    .from("ingested_chats")
    .select("sender")
    .eq("id", sourceId)
    .maybeSingle();
  if (sourceError) throw sourceError;

  const sender = String(source?.sender ?? "").trim();
  if (!sender || normalizeNickname(sender) !== normalizeNickname(nickname)) {
    return { ok: false, error: "nickname_mismatch" };
  }

  const { data, error } = await supabase
    .from("rooms")
    .update({ owner_nickname: nickname, updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select("*")
    .single();
  if (error) throw error;

  return { ok: true, room: data as Room };
}

function normalizeNickname(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
