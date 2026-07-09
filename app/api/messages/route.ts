import { NextRequest, NextResponse } from "next/server";
import { createMessage, listMessages } from "@/services/messageService";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  try {
    const messages = await listMessages(roomId);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "messages_fetch_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const roomId = String(body.room_id ?? "");
  const nickname = String(body.nickname ?? "").trim();
  const content = String(body.content ?? "").trim();
  if (!roomId || !nickname || !content) return NextResponse.json({ error: "room_id, nickname, content are required" }, { status: 400 });
  try {
    const message = await createMessage(roomId, nickname, content);
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "message_create_failed" }, { status: 500 });
  }
}
