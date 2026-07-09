import { getServerSupabase } from "@/lib/supabase/server";

export const fallbackAdminNicknames = ["나스큐"];

export function normalizeAdminNickname(value: string) {
  return value.trim();
}

export async function listAdminNicknames() {
  const supabase = getServerSupabase();
  if (!supabase) return fallbackAdminNicknames;

  const { data, error } = await supabase.from("app_settings").select("value").eq("key", "admin_nicknames").maybeSingle();
  if (error || !data?.value) return fallbackAdminNicknames;

  return uniqueAdminNicknames([...fallbackAdminNicknames, ...String(data.value).split(",")]);
}

export async function isAdminNickname(nickname: string) {
  const normalized = normalizeAdminNickname(nickname);
  if (!normalized) return false;
  const admins = await listAdminNicknames();
  return admins.includes(normalized);
}

export async function saveAdminNicknames(admins: string[]) {
  const supabase = getServerSupabase();
  if (!supabase) return { ok: false as const, error: "supabase_not_configured" };

  const nextAdmins = uniqueAdminNicknames([...fallbackAdminNicknames, ...admins]);
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "admin_nicknames", value: nextAdmins.join(","), updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, admins: nextAdmins };
}

function uniqueAdminNicknames(values: string[]) {
  return Array.from(new Set(values.map(normalizeAdminNickname).filter(Boolean)));
}
