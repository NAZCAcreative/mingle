import { ROOM_LIST_WINDOW_HOURS } from "@/lib/constants";
import { findMergeCandidate } from "@/lib/matcher";
import { addRoomTtl, computeRoomExpireAt } from "@/lib/time";
import { cleanRoomTitle } from "@/lib/title";
import type { AiAnalysis } from "@/types/ai";
import type { Message } from "@/types/message";
import type { Room } from "@/types/room";

type Gender = "male" | "female" | "other";

type LocalState = {
  rooms: Room[];
  messages: Record<string, Message[]>;
  participants: Record<string, Record<string, Gender>>;
  ingestedIds: Set<number>;
};

const globalStore = globalThis as typeof globalThis & {
  __mingleLocalState?: LocalState;
};

const state: LocalState =
  globalStore.__mingleLocalState ??
  (globalStore.__mingleLocalState = {
    rooms: [],
    messages: {},
    participants: {},
    ingestedIds: new Set<number>()
  });

state.messages ??= {};
state.participants ??= {};
state.ingestedIds ??= new Set<number>();

export function listLocalActiveRooms() {
  const now = Date.now();
  const listSince = now - ROOM_LIST_WINDOW_HOURS * 60 * 60 * 1000;
  return state.rooms
    .filter(
      (room) =>
        room.status !== "expired" &&
        new Date(room.expire_at).getTime() > now &&
        new Date(room.created_at).getTime() >= listSince
    )
    .map(withParticipantCounts)
    .sort(compareRoomsBySourceMessage);
}

function compareRoomsByCreatedAt(a: Room, b: Room) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function compareRoomsBySourceMessage(a: Room, b: Room) {
  const aSourceId = Number(a.source_message_id);
  const bSourceId = Number(b.source_message_id);

  if (Number.isFinite(aSourceId) && Number.isFinite(bSourceId) && aSourceId !== bSourceId) {
    return bSourceId - aSourceId;
  }

  return compareRoomsByCreatedAt(a, b);
}

export function getLocalRoom(roomId: string) {
  const room = state.rooms.find((room) => room.id === roomId);
  return room ? withParticipantCounts(room) : null;
}

export function hasLocalIngested(id: number) {
  return state.ingestedIds.has(id);
}

export function markLocalIngested(id: number) {
  state.ingestedIds.add(id);
}

export function latestLocalIngestedId() {
  if (!state.ingestedIds.size) return null;
  return Math.max(...Array.from(state.ingestedIds));
}

export function upsertLocalRoomFromAnalysis(
  analysis: AiAnalysis,
  sourceMessageId?: string,
  kakaoSender?: string | null,
  baseTime?: Date,
  rawContent?: string | null
) {
  if (!analysis.is_actionable || analysis.type === "ignore") return null;

  const now = baseTime ?? new Date();

  // 같은 목적의 방이 이미 있으면 새로 만들지 않고 기존 방을 갱신한다.
  const candidate = findMergeCandidate(listLocalActiveRooms(), analysis);
  if (candidate) {
    state.rooms = state.rooms.map((item) =>
      item.id === candidate.id
        ? {
            ...item,
            current_people: Math.max(item.current_people, analysis.current_people || 0),
            max_people: analysis.max_people || item.max_people,
            keywords: Array.from(new Set([...(item.keywords ?? []), ...(analysis.keywords ?? [])])),
            source_message_id: sourceMessageId ?? item.source_message_id,
            last_message_at: now.toISOString(),
            expire_at: new Date(
              Math.max(computeRoomExpireAt(now, analysis.meeting_time_text).getTime(), new Date(item.expire_at).getTime())
            ).toISOString(),
            updated_at: new Date().toISOString()
          }
        : item
    );
    return getLocalRoom(candidate.id);
  }

  const room: Room = {
    id: `local-${sourceMessageId ?? crypto.randomUUID()}`,
    title: cleanRoomTitle(rawContent?.trim() || analysis.title),
    category: analysis.category,
    summary: rawContent?.trim() || analysis.summary,
    origin: analysis.origin,
    destination: analysis.destination,
    meeting_time_text: analysis.meeting_time_text,
    current_people: 0,
    max_people: analysis.max_people,
    status: analysis.type === "question" ? "answering" : "open",
    merge_key: analysis.merge_key,
    keywords: analysis.keywords,
    source_message_id: sourceMessageId ?? null,
    kakao_sender: kakaoSender ?? null,
    owner_nickname: null,
    last_message_at: now.toISOString(),
    expire_at: computeRoomExpireAt(now, analysis.meeting_time_text).toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };
  state.rooms.unshift(room);
  return room;
}

export function registerLocalRoomOwner(roomId: string, nickname: string) {
  const room = state.rooms.find((item) => item.id === roomId);
  if (!room) return { ok: false, error: "room_not_found" };
  if (room.owner_nickname) return { ok: true, room: withParticipantCounts(room) };
  if (!room.kakao_sender || normalizeNickname(room.kakao_sender) !== normalizeNickname(nickname)) {
    return { ok: false, error: "nickname_mismatch" };
  }

  state.rooms = state.rooms.map((item) =>
    item.id === roomId ? { ...item, owner_nickname: nickname, updated_at: new Date().toISOString() } : item
  );
  return { ok: true, room: getLocalRoom(roomId) };
}

export function listLocalMessages(roomId: string) {
  const genders = state.participants[roomId] ?? {};
  return (state.messages[roomId] ?? []).map((message) => ({
    ...message,
    gender: genders[message.nickname] ?? null
  }));
}

export function joinLocalRoom(roomId: string, nickname: string, gender: Gender, previousNickname?: string) {
  if (!state.rooms.some((room) => room.id === roomId)) return null;
  const isNewJoin = !(nickname in (state.participants[roomId] ?? {}));
  state.participants[roomId] = {
    ...(state.participants[roomId] ?? {}),
    [nickname]: gender
  };
  const renamed = Boolean(previousNickname && previousNickname !== nickname);
  if (renamed) createLocalMessage(roomId, "SYSTEM", `${previousNickname}님이 ${nickname}님으로 닉네임을 변경했습니다`);
  else if (isNewJoin) createLocalMessage(roomId, "SYSTEM", `${nickname}님이 입장했습니다`);
  return getLocalRoom(roomId);
}

export function leaveLocalRoom(roomId: string, nickname: string) {
  const participants = state.participants[roomId];
  if (!participants || !(nickname in participants)) return getLocalRoom(roomId);
  const { [nickname]: _removed, ...rest } = participants;
  state.participants[roomId] = rest;
  return getLocalRoom(roomId);
}

export type RoomInfoPatch = {
  title?: string;
  summary?: string;
  meeting_time_text?: string | null;
  destination?: string | null;
  max_people?: number | null;
};

export function updateLocalRoomInfo(roomId: string, nickname: string, patch: RoomInfoPatch) {
  const room = state.rooms.find((item) => item.id === roomId);
  if (!room) return { ok: false as const, error: "room_not_found" };
  if (!room.owner_nickname || normalizeNickname(room.owner_nickname) !== normalizeNickname(nickname)) {
    return { ok: false as const, error: "not_owner" };
  }

  state.rooms = state.rooms.map((item) =>
    item.id === roomId ? { ...item, ...patch, updated_at: new Date().toISOString() } : item
  );
  return { ok: true as const, room: getLocalRoom(roomId) };
}

export function createLocalMessage(roomId: string, nickname: string, content: string) {
  const now = new Date();
  const message: Message = {
    id: crypto.randomUUID(),
    room_id: roomId,
    nickname,
    content,
    created_at: now.toISOString()
  };
  state.messages[roomId] = [...(state.messages[roomId] ?? []), message];
  state.rooms = state.rooms.map((room) =>
    room.id === roomId
      ? {
          ...room,
          last_message_at: now.toISOString(),
          expire_at: new Date(Math.max(addRoomTtl(now).getTime(), new Date(room.expire_at).getTime())).toISOString(),
          updated_at: now.toISOString()
        }
      : room
  );
  return message;
}

function withParticipantCounts(room: Room): Room {
  const participants = state.participants[room.id] ?? {};
  const counts = { male: 0, female: 0, other: 0 };

  for (const gender of Object.values(participants)) {
    counts[gender] += 1;
  }

  return {
    ...room,
    current_people: Object.keys(participants).length,
    participant_count: Object.keys(participants).length,
    gender_counts: counts
  };
}

function normalizeNickname(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
