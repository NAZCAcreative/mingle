import { NextResponse } from "next/server";
import { ingestChats } from "@/services/ingestService";

export async function POST() {
  const result = await ingestChats();
  return NextResponse.json(result);
}
