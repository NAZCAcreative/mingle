"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeJoinedRoom } from "@/hooks/useMyChatRooms";

export function LeaveRoomButton({ roomId, nickname }: { roomId: string; nickname: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const leaveRoom = async () => {
    if (leaving) return;
    if (!window.confirm("방에서 나가시겠어요?")) return;
    setLeaving(true);
    if (nickname) {
      await fetch("/api/rooms/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, nickname })
      });
    }
    removeJoinedRoom(roomId);
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={leaveRoom}
      disabled={leaving}
      className="inline-flex items-center gap-1.5 text-sm text-muted disabled:text-neutral-300"
    >
      <LogOut className="h-4 w-4" />
      {leaving ? "나가는 중..." : "나가기"}
    </button>
  );
}
