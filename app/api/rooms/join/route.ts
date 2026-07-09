import { NextRequest, NextResponse } from "next/server";
import { joinRoom } from "@/services/roomService";

const genders = new Set(["male", "female", "other"]);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const roomId = String(body.room_id ?? "");
  const nickname = String(body.nickname ?? "").trim();
  const gender = String(body.gender ?? "");
  const deviceId = typeof body.device_id === "string" ? body.device_id.slice(0, 64) : "";
  const previousNickname = typeof body.previous_nickname === "string" ? body.previous_nickname.trim() : "";

  if (!roomId || !nickname || !genders.has(gender)) {
    return NextResponse.json({ error: "room_id, nickname, gender are required" }, { status: 400 });
  }

  const room = await joinRoom(roomId, nickname, gender as "male" | "female" | "other", deviceId, previousNickname);
  return NextResponse.json({ room });
}
