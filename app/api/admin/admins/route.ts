import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

const FALLBACK_ADMINS = ["나스큐"];

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ admins: FALLBACK_ADMINS });

  const { data, error } = await supabase.from("app_settings").select("value").eq("key", "admin_nicknames").maybeSingle();
  if (error || !data?.value) return NextResponse.json({ admins: FALLBACK_ADMINS });

  const admins = String(data.value)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return NextResponse.json({ admins: Array.from(new Set([...FALLBACK_ADMINS, ...admins])) });
}
