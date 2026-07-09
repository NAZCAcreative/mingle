"use client";

import { Crown, LogOut, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CountdownBadge } from "@/components/CountdownBadge";
import { RoomEditModal } from "@/components/RoomEditModal";
import { categoryMeta } from "@/lib/constants";
import type { Room } from "@/types/room";

function normalizeNickname(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function ChatHeader({ room, nickname, onOwnerRegistered }: { room: Room; nickname: string; onOwnerRegistered: () => Promise<void> }) {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const meta = categoryMeta[room.category];
  const hasOwner = Boolean(room.owner_nickname);
  const isOwner = hasOwner && Boolean(nickname) && normalizeNickname(room.owner_nickname ?? "") === normalizeNickname(nickname);

  const registerOwner = async () => {
    if (!nickname || registering || hasOwner) return;
    setRegistering(true);
    const response = await fetch("/api/rooms/owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: room.id, nickname })
    });
    setRegistering(false);

    if (!response.ok) {
      window.alert("카톡 닉네임과 현재 닉네임이 일치할 때만 방장등록할 수 있어요.");
      return;
    }

    await onOwnerRegistered();
  };

  const leaveRoom = async () => {
    if (leaving) return;
    if (!window.confirm("방에서 나가시겠어요?")) return;
    setLeaving(true);
    if (nickname) {
      await fetch("/api/rooms/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: room.id, nickname })
      });
    }
    router.push("/");
  };

  return (
    <section className="border-b border-blush bg-cream/95 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-ink">{room.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-xs font-black ${meta.badge}`}>{meta.label}</span>
            {hasOwner ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-blush px-2 py-1 text-xs font-black text-mingle">
                <Crown className="h-3.5 w-3.5" />
                방장 {room.owner_nickname}
              </span>
            ) : null}
            <span className="text-sm font-bold text-muted">
              현재 {room.current_people}
              {room.max_people ? `/${room.max_people}명` : "개 답변"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <CountdownBadge expireAt={room.expire_at} />
          {!hasOwner ? (
            <button
              type="button"
              onClick={registerOwner}
              disabled={!nickname || registering}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-button bg-mingle px-3 text-sm font-black text-white shadow-soft disabled:bg-neutral-300"
            >
              <Crown className="h-4 w-4" />
              {registering ? "등록중" : "방장등록"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {isOwner ? (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-button bg-white px-3 text-sm font-black text-mingle shadow-card"
          >
            <Pencil className="h-4 w-4" />
            방 정보 수정
          </button>
        ) : null}
        <button
          type="button"
          onClick={leaveRoom}
          disabled={leaving}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-button bg-white px-3 text-sm font-black text-muted shadow-card disabled:text-neutral-300"
        >
          <LogOut className="h-4 w-4" />
          {leaving ? "나가는 중..." : "방 나가기"}
        </button>
      </div>

      {editOpen ? <RoomEditModal room={room} onClose={() => setEditOpen(false)} onSaved={onOwnerRegistered} /> : null}
    </section>
  );
}
