import { ROOM_LIST_WINDOW_HOURS, ROOM_TTL_HOURS } from "@/lib/constants";
import { findMergeCandidate } from "@/lib/matcher";
import { addRoomTtl } from "@/lib/time";
import { getServerSupabase } from "@/lib/supabase/server";
import { cleanRoomTitle } from "@/lib/title";
import {
  getLocalRoom,
  joinLocalRoom,
  leaveLocalRoom,
  listLocalActiveRooms,
  registerLocalRoomOwner,
  updateLocalRoomInfo,
  upsertLocalRoomFromAnalysis,
  type RoomInfoPatch
} from "@/services/localStore";
import type { AiAnalysis } from "@/types/ai";
import type { Room } from "@/types/room";

type Gender = "male" | "female" | "other";

export async function listActiveRooms(): Promise<Room[]> {
  const supabase = getServerSupabase();
  if (!supabase) return listLocalActiveRooms();
  const listSince = new Date(Date.now() - ROOM_LIST_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .neq("status", "expired")
    .gt("expire_at", new Date().toISOString())
    .gte("created_at", listSince)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withParticipantCounts(data ?? []);
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const supabase = getServerSupabase();
  if (!supabase) return getLocalRoom(roomId);
  const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw error;
  const [room] = await withParticipantCounts(data ? [data] : []);
  return room ?? null;
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

export async function upsertRoomFromAnalysis(
  analysis: AiAnalysis,
  sourceMessageId?: string,
  kakaoSender?: string | null,
  sourceCreatedAt?: string | null
) {
  const supabase = getServerSupabase();
  if (!analysis.is_actionable || analysis.type === "ignore") return null;

  // 원본 메시지 시각 기준으로 방을 생성한다. TTL이 이미 지난 옛 메시지는 방을 만들지 않는다.
  const sourceTime = sourceCreatedAt ? new Date(sourceCreatedAt) : null;
  const baseTime = sourceTime && !Number.isNaN(sourceTime.getTime()) ? sourceTime : new Date();
  if (Date.now() - baseTime.getTime() > ROOM_TTL_HOURS * 60 * 60 * 1000) return null;

  if (!supabase) return upsertLocalRoomFromAnalysis(analysis, sourceMessageId, kakaoSender, baseTime);

  // 같은 목적의 방이 이미 있으면 새로 만들지 않고 기존 방을 갱신한다.
  const activeRooms = await listActiveRooms();
  const candidate = findMergeCandidate(activeRooms, analysis);
  if (candidate) {
    const { data, error } = await supabase
      .from("rooms")
      .update({
        current_people: Math.max(candidate.current_people, analysis.current_people || 0),
        max_people: analysis.max_people || candidate.max_people,
        keywords: Array.from(new Set([...(candidate.keywords ?? []), ...(analysis.keywords ?? [])])),
        source_message_id: sourceMessageId,
        last_message_at: baseTime.toISOString(),
        expire_at: addRoomTtl(baseTime).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", candidate.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Room;
  }

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
      created_at: baseTime.toISOString(),
      last_message_at: baseTime.toISOString(),
      expire_at: addRoomTtl(baseTime).toISOString()
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Room;
}

export async function joinRoom(roomId: string, nickname: string, gender: Gender) {
  const supabase = getServerSupabase();
  if (!supabase) return joinLocalRoom(roomId, nickname, gender);

  const { error } = await supabase.from("room_participants").upsert(
    {
      room_id: roomId,
      nickname,
      gender,
      updated_at: new Date().toISOString()
    },
    { onConflict: "room_id,nickname" }
  );
  if (error) return getRoom(roomId);

  return getRoom(roomId);
}

export async function leaveRoom(roomId: string, nickname: string) {
  const supabase = getServerSupabase();
  if (!supabase) return leaveLocalRoom(roomId, nickname);

  const { error } = await supabase.from("room_participants").delete().eq("room_id", roomId).eq("nickname", nickname);
  if (error) return getRoom(roomId);

  return getRoom(roomId);
}

export async function updateRoomInfo(roomId: string, nickname: string, patch: RoomInfoPatch) {
  const supabase = getServerSupabase();
  if (!supabase) return updateLocalRoomInfo(roomId, nickname, patch);

  const room = await getRoom(roomId);
  if (!room) return { ok: false as const, error: "room_not_found" };
  if (!room.owner_nickname || normalizeNickname(room.owner_nickname) !== normalizeNickname(nickname)) {
    return { ok: false as const, error: "not_owner" };
  }

  const { data, error } = await supabase
    .from("rooms")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select("*")
    .single();
  if (error) throw error;
  return { ok: true as const, room: data as Room };
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

async function withParticipantCounts(rooms: Room[]): Promise<Room[]> {
  if (!rooms.length) return rooms;

  const supabase = getServerSupabase();
  if (!supabase) return rooms;

  const roomIds = rooms.map((room) => room.id);
  const { data, error } = await supabase.from("room_participants").select("room_id, gender").in("room_id", roomIds);
  if (error) return rooms;

  const countsByRoom = new Map<string, { male: number; female: number; other: number }>();
  for (const participant of data ?? []) {
    const roomId = String(participant.room_id);
    const gender = String(participant.gender) as Gender;
    const counts = countsByRoom.get(roomId) ?? { male: 0, female: 0, other: 0 };
    if (gender === "male" || gender === "female" || gender === "other") counts[gender] += 1;
    countsByRoom.set(roomId, counts);
  }

  return rooms.map((room) => {
    const counts = countsByRoom.get(room.id) ?? { male: 0, female: 0, other: 0 };
    const participantCount = counts.male + counts.female + counts.other;

    return {
      ...room,
      current_people: participantCount,
      participant_count: participantCount,
      gender_counts: counts
    };
  });
}
