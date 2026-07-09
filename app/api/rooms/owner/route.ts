import { NextRequest, NextResponse } from "next/server";
import { registerRoomOwner } from "@/services/roomService";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const roomId = String(body.room_id ?? "");
  const nickname = String(body.nickname ?? "").trim();

  if (!roomId || !nickname) {
    return NextResponse.json({ error: "room_id and nickname are required" }, { status: 400 });
  }

  const result = await registerRoomOwner(roomId, nickname);
  const status = result.ok ? 200 : result.error === "nickname_mismatch" ? 403 : 400;
  return NextResponse.json(result, { status });
}
