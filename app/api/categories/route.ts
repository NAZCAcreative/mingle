import { NextResponse } from "next/server";
import { categoryMeta } from "@/lib/constants";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const labels: Record<string, string> = Object.fromEntries(
    Object.entries(categoryMeta).map(([key, meta]) => [key, meta.label])
  );

  const supabase = getServerSupabase();
  if (supabase) {
    const { data } = await supabase.from("app_settings").select("key,value").like("key", "category_label_%");
    for (const row of data ?? []) {
      const category = String(row.key).replace("category_label_", "");
      if (category in labels && row.value) labels[category] = String(row.value);
    }
  }

  return NextResponse.json({ labels });
}
