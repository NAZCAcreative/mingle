"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { NicknameModal } from "@/components/NicknameModal";
import { useCountdown } from "@/hooks/useCountdown";
import { useMessages } from "@/hooks/useMessages";
import { markJoinedRoomRead, saveJoinedRoom } from "@/hooks/useMyChatRooms";
import { useNickname } from "@/hooks/useNickname";
import { useRoom } from "@/hooks/useRoom";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const { room, loading, reload } = useRoom(roomId);
  const { messages, send } = useMessages(roomId);
  const { ready, displayName, profile, setProfile } = useNickname();
  const countdown = useCountdown(room?.expire_at ?? new Date().toISOString());
  const joinedNicknameRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !profile.gender || !room || countdown.expired || room.status === "expired") return;

    const syncParticipant = async () => {
      const previousNickname = joinedNicknameRef.current;

      if (previousNickname && previousNickname !== profile.nickname) {
        await fetch("/api/rooms/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: roomId, nickname: previousNickname })
        });
      }

      if (previousNickname !== profile.nickname) {
        await fetch("/api/rooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: roomId, nickname: profile.nickname, gender: profile.gender })
        });
        saveJoinedRoom(room);
        joinedNicknameRef.current = profile.nickname;
        await reload();
      }
    };

    void syncParticipant();
  }, [countdown.expired, profile.gender, profile.nickname, ready, reload, room, roomId]);

  useEffect(() => {
    if (!room || !ready) return;
    markJoinedRoomRead(room, messages.at(-1)?.created_at);
  }, [messages, ready, room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center px-6 font-black text-muted">채팅방을 불러오는 중이에요</main>;
  }

  if (!room) {
    return <main className="grid min-h-screen place-items-center px-6 font-black text-muted">방이 종료되었거나 찾을 수 없어요</main>;
  }

  const expired = countdown.expired || room.status === "expired";
  const place = room.destination || room.origin;
  const detailItems = [room.meeting_time_text ? `출발: ${room.meeting_time_text}` : null, place ? `장소: ${place}` : null].filter(Boolean);

  const saveProfile = async (nextProfile: typeof profile) => {
    setProfile(nextProfile);
    await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, nickname: nextProfile.nickname, gender: nextProfile.gender })
    });
    saveJoinedRoom(room);
    await reload();
  };

  return (
    <main className="flex min-h-screen flex-col">
      <ChatHeader room={room} nickname={profile.nickname} onOwnerRegistered={reload} />
      <section className="mx-4 mt-4 rounded-card border border-blush bg-white p-4 shadow-card">
        <p className="text-sm font-black text-mingle">원본 대화에서 추출한 요약 정보</p>
        <p className="mt-2 text-[15px] font-bold leading-relaxed text-ink">{room.summary}</p>
        {detailItems.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold text-muted">
            {detailItems.map((item) => (
              <span key={item} className="rounded-xl bg-cream px-3 py-2">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="flex-1 space-y-3 px-4 py-4">
        {!ready && !expired && <NicknameModal onSave={saveProfile} />}
        {expired && <div className="rounded-card bg-white p-5 text-center font-black text-muted shadow-card">방이 종료되었습니다</div>}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} mine={message.nickname === displayName} />
        ))}
        <div ref={messagesEndRef} />
      </section>

      <MessageInput
        disabled={!ready || expired}
        onSend={async (content) => {
          await send(displayName, content);
          await reload();
        }}
      />
    </main>
  );
}
