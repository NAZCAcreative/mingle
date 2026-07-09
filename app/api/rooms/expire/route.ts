import { NextResponse } from "next/server";
import { expireRooms } from "@/services/roomService";

export async function POST() {
  const result = await expireRooms();
  return NextResponse.json(result);
}
