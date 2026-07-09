"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { LeaveRoomButton } from "@/components/LeaveRoomButton";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { NicknameModal } from "@/components/NicknameModal";
import { useCountdown } from "@/hooks/useCountdown";
import { useMessages } from "@/hooks/useMessages";
import { markJoinedRoomRead, saveJoinedRoom } from "@/hooks/useMyChatRooms";
import { useNickname } from "@/hooks/useNickname";
import { useRoom } from "@/hooks/useRoom";
import { getDeviceId } from "@/lib/deviceId";
import { cleanDisplayText } from "@/lib/text";
import { cleanRoomTitle } from "@/lib/title";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const { room, loading, reload } = useRoom(roomId);
  const { messages, send, reload: reloadMessages } = useMessages(roomId);
  const { ready, displayName, profile, setProfile } = useNickname();
  const countdown = useCountdown(room?.expire_at ?? new Date().toISOString());
  const joinedNicknameRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

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
          body: JSON.stringify({
            room_id: roomId,
            nickname: profile.nickname,
            gender: profile.gender,
            device_id: getDeviceId(),
            previous_nickname: previousNickname || undefined
          })
        });
        saveJoinedRoom(room);
        joinedNicknameRef.current = profile.nickname;
        await Promise.all([reload(), reloadMessages()]);
      }
    };

    void syncParticipant();
  }, [countdown.expired, profile.gender, profile.nickname, ready, reload, reloadMessages, room, roomId]);

  useEffect(() => {
    if (!room || !ready) return;
    markJoinedRoomRead(room, messages.at(-1)?.created_at);
  }, [messages, ready, room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center px-6 font-semibold text-muted">채팅방을 불러오는 중이에요</main>;
  }

  if (!room) {
    return <main className="grid min-h-screen place-items-center px-6 font-semibold text-muted">방이 종료되었거나 찾을 수 없어요</main>;
  }

  const expired = countdown.expired || room.status === "expired";
  const place = cleanDisplayText(room.destination) || cleanDisplayText(room.origin);
  const meetingText = cleanDisplayText(room.meeting_time_text);
  const summaryText = cleanDisplayText(room.summary);
  const showSummary = Boolean(summaryText && cleanRoomTitle(summaryText) !== room.title.trim());
  const detailItems = [meetingText ? `출발: ${meetingText}` : null, place ? `장소: ${place}` : null].filter(Boolean);

  const saveProfile = async (nextProfile: typeof profile) => {
    setProfile(nextProfile);
    await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, nickname: nextProfile.nickname, gender: nextProfile.gender, device_id: getDeviceId() })
    });
    saveJoinedRoom(room);
    await Promise.all([reload(), reloadMessages()]);
  };

  return (
    <main className="flex h-[calc(100dvh-69px)] flex-col overflow-hidden">
      <ChatHeader room={room} nickname={profile.nickname} onOwnerRegistered={reload} />

      <section className="border-b border-blush bg-white/85">
        <button
          type="button"
          onClick={() => setSummaryOpen((value) => !value)}
          className="flex h-11 w-full items-center justify-between px-4 text-sm text-mingle"
          aria-expanded={summaryOpen}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            요약 정보
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${summaryOpen ? "rotate-180" : ""}`} />
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${summaryOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4">
              {showSummary ? <p className="text-[15px] font-light leading-relaxed text-ink">{summaryText}</p> : null}
              {!showSummary && !detailItems.length ? (
                <p className="text-sm font-light text-muted">추가 요약 정보가 없습니다.</p>
              ) : null}
              {detailItems.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-light text-muted">
                  {detailItems.map((item) => (
                    <span key={item} className="rounded-xl bg-cream px-3 py-2">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-blush/30 px-4 py-4">
        {!ready && !expired && <NicknameModal onSave={saveProfile} />}
        {expired && <div className="rounded-card bg-white p-5 text-center font-semibold text-muted shadow-card">방이 종료되었습니다</div>}
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

      <div className="flex justify-center border-t border-blush bg-cream pb-3 pt-2">
        <LeaveRoomButton roomId={roomId} nickname={profile.nickname} />
      </div>
    </main>
  );
}
