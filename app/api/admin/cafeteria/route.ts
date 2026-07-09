import { NextRequest, NextResponse } from "next/server";
import { getCafeteriaSettings, saveCafeteriaSettings, type CafeteriaManualMenu } from "@/lib/cafeteria";
import { isAdminNickname, normalizeAdminNickname } from "@/lib/admins";

export async function GET(request: NextRequest) {
  const actor = normalizeAdminNickname(request.nextUrl.searchParams.get("actor") ?? "");
  if (!(await isAdminNickname(actor))) return NextResponse.json({ error: "admin_only" }, { status: 403 });

  return NextResponse.json(await getCafeteriaSettings());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const actor = normalizeAdminNickname(String(body.actor ?? ""));
  if (!(await isAdminNickname(actor))) return NextResponse.json({ error: "admin_only" }, { status: 403 });

  const manualMenu = normalizeManualMenu(body.manualMenu);
  if (body.manualMenu && !manualMenu) return NextResponse.json({ error: "invalid_manual_menu" }, { status: 400 });

  const result = await saveCafeteriaSettings({ enabled: body.enabled === true, manualMenu });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true });
}

function normalizeManualMenu(value: unknown): CafeteriaManualMenu | null {
  if (!value || typeof value !== "object") return null;

  const menu = value as Partial<CafeteriaManualMenu>;
  const date = String(menu.date ?? "").trim();
  const name = String(menu.name ?? "").trim();
  const meals = Array.isArray(menu.meals)
    ? menu.meals
        .map((meal) => ({
          label: String(meal?.label ?? "").trim(),
          items: Array.isArray(meal?.items) ? meal.items.map(String).map((item) => item.trim()).filter(Boolean) : []
        }))
        .filter((meal) => meal.label && meal.items.length)
    : [];

  return date && name && meals.length ? { date, name, meals } : null;
}
