"use client";

import { Crown, Pencil } from "lucide-react";
import { useState } from "react";
import { CountdownBadge } from "@/components/CountdownBadge";
import { RoomEditModal } from "@/components/RoomEditModal";
import { categoryMeta } from "@/lib/constants";
import type { Room } from "@/types/room";

function normalizeNickname(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function ChatHeader({ room, nickname, onOwnerRegistered }: { room: Room; nickname: string; onOwnerRegistered: () => Promise<void> }) {
  const [registering, setRegistering] = useState(false);
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

  return (
    <section className="shrink-0 border-b border-blush bg-cream/95 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-keep text-xl font-light leading-snug tracking-tight text-ink [font-family:var(--font-plex-kr)]">{room.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[13px] font-light ${meta.badge}`}>{meta.label}</span>
            {hasOwner ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-blush px-2 py-1 text-xs font-semibold text-mingle">
                <Crown className="h-3.5 w-3.5" />
                방장 {room.owner_nickname}
              </span>
            ) : null}
            <span className="text-sm font-medium text-muted">
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
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-button bg-mingle px-3 text-sm font-semibold text-white shadow-soft disabled:bg-neutral-300"
            >
              <Crown className="h-4 w-4" />
              {registering ? "등록중" : "방장등록"}
            </button>
          ) : null}
        </div>
      </div>

      {isOwner ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-button bg-white px-3 text-sm font-semibold text-mingle shadow-card"
          >
            <Pencil className="h-4 w-4" />
            방 정보 수정
          </button>
        </div>
      ) : null}

      {editOpen ? <RoomEditModal room={room} onClose={() => setEditOpen(false)} onSaved={onOwnerRegistered} /> : null}
    </section>
  );
}
