import { createClient } from "@supabase/supabase-js";

export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !/^https?:\/\//.test(url)) return null;
  return createClient(url, key);
}
