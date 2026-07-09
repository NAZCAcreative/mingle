import { NextRequest, NextResponse } from "next/server";
import { leaveRoom } from "@/services/roomService";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const roomId = String(body.room_id ?? "");
  const nickname = String(body.nickname ?? "").trim();

  if (!roomId || !nickname) {
    return NextResponse.json({ error: "room_id and nickname are required" }, { status: 400 });
  }

  const room = await leaveRoom(roomId, nickname);
  return NextResponse.json({ room });
}
