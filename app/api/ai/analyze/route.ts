import { NextRequest, NextResponse } from "next/server";
import { analyzeMessage } from "@/services/aiService";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const content = String(body.content ?? body.message ?? "").trim();
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });
  const analysis = await analyzeMessage(content);
  return NextResponse.json(analysis);
}
