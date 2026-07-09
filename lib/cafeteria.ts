import { getServerSupabase } from "@/lib/supabase/server";

export type CafeteriaMeal = {
  label: string;
  items: string[];
};

export type CafeteriaManualMenu = {
  date: string;
  name: string;
  meals: CafeteriaMeal[];
};

export type CafeteriaSettings = {
  enabled: boolean;
  manualMenu: CafeteriaManualMenu | null;
};

export const CAFETERIA_ENABLED_KEY = "cafeteria_enabled";
export const CAFETERIA_MANUAL_MENU_KEY = "cafeteria_manual_menu";

const defaults: CafeteriaSettings = {
  enabled: false,
  manualMenu: null
};

export async function getCafeteriaSettings(): Promise<CafeteriaSettings> {
  const supabase = getServerSupabase();
  if (!supabase) return defaults;

  const { data, error } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", [CAFETERIA_ENABLED_KEY, CAFETERIA_MANUAL_MENU_KEY]);

  if (error) return defaults;

  const values = new Map((data ?? []).map((row) => [row.key, row.value ?? ""]));
  return {
    enabled: values.get(CAFETERIA_ENABLED_KEY) === "true",
    manualMenu: parseManualMenu(values.get(CAFETERIA_MANUAL_MENU_KEY))
  };
}

export async function saveCafeteriaSettings(settings: CafeteriaSettings) {
  const supabase = getServerSupabase();
  if (!supabase) return { ok: false as const, error: "supabase_not_configured" };

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("app_settings").upsert(
    [
      { key: CAFETERIA_ENABLED_KEY, value: String(settings.enabled), updated_at: updatedAt },
      { key: CAFETERIA_MANUAL_MENU_KEY, value: settings.manualMenu ? JSON.stringify(settings.manualMenu) : "", updated_at: updatedAt }
    ],
    { onConflict: "key" }
  );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

function parseManualMenu(value: string | undefined): CafeteriaManualMenu | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<CafeteriaManualMenu>;
    if (!parsed.date || !parsed.name || !Array.isArray(parsed.meals)) return null;

    const meals = parsed.meals
      .filter((meal): meal is CafeteriaMeal => Boolean(meal && typeof meal.label === "string" && Array.isArray(meal.items)))
      .map((meal) => ({
        label: meal.label.trim(),
        items: meal.items.map(String).map((item) => item.trim()).filter(Boolean)
      }))
      .filter((meal) => meal.label);

    return meals.length ? { date: parsed.date, name: parsed.name, meals } : null;
  } catch {
    return null;
  }
}
