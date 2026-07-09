import { NextRequest, NextResponse } from "next/server";
import { createMessage, listMessages } from "@/services/messageService";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  const messages = await listMessages(roomId);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const roomId = String(body.room_id ?? "");
  const nickname = String(body.nickname ?? "").trim();
  const content = String(body.content ?? "").trim();
  if (!roomId || !nickname || !content) return NextResponse.json({ error: "room_id, nickname, content are required" }, { status: 400 });
  const message = await createMessage(roomId, nickname, content);
  return NextResponse.json({ message });
}
