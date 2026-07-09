import { addRoomTtl } from "@/lib/time";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLocalMessage, listLocalMessages } from "@/services/localStore";
import type { Message } from "@/types/message";

export async function listMessages(roomId: string): Promise<Message[]> {
  if (roomId.startsWith("local-")) return listLocalMessages(roomId);

  const supabase = getServerSupabase();
  if (!supabase) return listLocalMessages(roomId);
  const { data, error } = await supabase.from("messages").select("*").eq("room_id", roomId).order("created_at");
  if (error) throw error;

  const { data: participants } = await supabase.from("room_participants").select("nickname, gender").eq("room_id", roomId);
  const genderByNickname = new Map(
    (participants ?? []).map((participant) => [String(participant.nickname), String(participant.gender) as Message["gender"]])
  );

  return (data ?? []).map((message) => ({
    ...message,
    gender: genderByNickname.get(message.nickname) ?? null
  }));
}

export async function createMessage(roomId: string, nickname: string, content: string) {
  const supabase = getServerSupabase();
  if (!supabase) return createLocalMessage(roomId, nickname, content);
  const now = new Date();
  const { data, error } = await supabase
    .from("messages")
    .insert({ room_id: roomId, nickname, content })
    .select("*")
    .single();
  if (error) throw error;
  const { data: roomRow } = await supabase.from("rooms").select("expire_at").eq("id", roomId).maybeSingle();
  const currentExpire = roomRow?.expire_at ? new Date(roomRow.expire_at).getTime() : 0;
  const nextExpire = new Date(Math.max(addRoomTtl(now).getTime(), currentExpire));
  const { error: roomError } = await supabase
    .from("rooms")
    .update({ last_message_at: now.toISOString(), expire_at: nextExpire.toISOString(), updated_at: now.toISOString() })
    .eq("id", roomId);
  if (roomError) throw roomError;
  return data as Message;
}
