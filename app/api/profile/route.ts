import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const deviceId = typeof body.device_id === "string" ? body.device_id.slice(0, 64) : "";
  const nickname = String(body.nickname ?? "").trim().slice(0, 32);
  const gender = String(body.gender ?? "");

  if (!deviceId || !nickname) {
    return NextResponse.json({ ok: false, error: "device_id and nickname are required" }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: true, stored: false });

  const { data: latest } = await supabase
    .from("nickname_events")
    .select("nickname,gender")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && latest.nickname === nickname && latest.gender === gender) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const { error } = await supabase.from("nickname_events").insert({ device_id: deviceId, nickname, gender });
  return NextResponse.json({ ok: !error, stored: !error, error: error?.message });
}
