import { NextRequest, NextResponse } from "next/server";
import { getRoom, listActiveRooms } from "@/services/roomService";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (roomId) {
    const room = await getRoom(roomId);
    return NextResponse.json({ room });
  }
  const rooms = await listActiveRooms();
  return NextResponse.json({ rooms });
}
