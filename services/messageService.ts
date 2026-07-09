import { addRoomTtl } from "@/lib/time";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLocalMessage, listLocalMessages } from "@/services/localStore";
import type { Message } from "@/types/message";

export async function listMessages(roomId: string): Promise<Message[]> {
  const supabase = getServerSupabase();
  if (!supabase) return listLocalMessages(roomId);
  const { data, error } = await supabase.from("messages").select("*").eq("room_id", roomId).order("created_at");
  if (error) throw error;
  return data ?? [];
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
  const { error: roomError } = await supabase
    .from("rooms")
    .update({ last_message_at: now.toISOString(), expire_at: addRoomTtl(now).toISOString(), updated_at: now.toISOString() })
    .eq("id", roomId);
  if (roomError) throw roomError;
  return data as Message;
}
