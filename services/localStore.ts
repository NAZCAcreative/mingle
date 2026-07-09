import { addRoomTtl } from "@/lib/time";
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
  return state.rooms
    .filter((room) => room.status !== "expired" && new Date(room.expire_at).getTime() > now)
    .map(withParticipantCounts)
    .sort(compareRoomsByCreatedAt);
}

function compareRoomsByCreatedAt(a: Room, b: Room) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
  return Math.max(100, ...Array.from(state.ingestedIds));
}

export function upsertLocalRoomFromAnalysis(analysis: AiAnalysis, sourceMessageId?: string, kakaoSender?: string | null) {
  if (!analysis.is_actionable || analysis.type === "ignore") return null;

  const now = new Date();

  const room: Room = {
    id: `local-${sourceMessageId ?? crypto.randomUUID()}`,
    title: cleanRoomTitle(analysis.title),
    category: analysis.category,
    summary: analysis.summary,
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
    expire_at: addRoomTtl(now).toISOString(),
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
  return state.messages[roomId] ?? [];
}

export function joinLocalRoom(roomId: string, nickname: string, gender: Gender) {
  if (!state.rooms.some((room) => room.id === roomId)) return null;
  state.participants[roomId] = {
    ...(state.participants[roomId] ?? {}),
    [nickname]: gender
  };
  return getLocalRoom(roomId);
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
      ? { ...room, last_message_at: now.toISOString(), expire_at: addRoomTtl(now).toISOString(), updated_at: now.toISOString() }
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
    participant_count: Object.keys(participants).length,
    gender_counts: counts
  };
}

function normalizeNickname(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
