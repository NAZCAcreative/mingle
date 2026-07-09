import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

const adminNickname = "나스큐";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const roomId = String(body.room_id ?? "");
  const nickname = String(body.nickname ?? "").trim();

  if (nickname !== adminNickname) {
    return NextResponse.json({ error: "admin_only" }, { status: 403 });
  }

  if (!roomId) {
    return NextResponse.json({ error: "room_id is required" }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("rooms")
    .update({
      status: "expired",
      expire_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", roomId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ room: data });
}
