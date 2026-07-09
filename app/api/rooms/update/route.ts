import { NextRequest, NextResponse } from "next/server";
import { updateRoomInfo } from "@/services/roomService";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const roomId = String(body.room_id ?? "");
  const nickname = String(body.nickname ?? "").trim();

  if (!roomId || !nickname) {
    return NextResponse.json({ error: "room_id and nickname are required" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 60) : undefined;
  const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 200) : undefined;
  const meetingTimeText =
    body.meeting_time_text === null ? null : typeof body.meeting_time_text === "string" ? body.meeting_time_text.trim().slice(0, 40) : undefined;
  const destination =
    body.destination === null ? null : typeof body.destination === "string" ? body.destination.trim().slice(0, 40) : undefined;
  const maxPeople =
    body.max_people === null ? null : Number.isFinite(Number(body.max_people)) && Number(body.max_people) > 0 ? Math.floor(Number(body.max_people)) : undefined;

  if (title !== undefined && !title) {
    return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
  }

  const patch = {
    ...(title !== undefined ? { title } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(meetingTimeText !== undefined ? { meeting_time_text: meetingTimeText } : {}),
    ...(destination !== undefined ? { destination } : {}),
    ...(maxPeople !== undefined ? { max_people: maxPeople } : {})
  };

  const result = await updateRoomInfo(roomId, nickname, patch);
  const status = result.ok ? 200 : result.error === "not_owner" ? 403 : 404;
  return NextResponse.json(result, { status });
}
