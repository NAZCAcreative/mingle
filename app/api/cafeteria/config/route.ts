import { NextResponse } from "next/server";
import { getCafeteriaSettings } from "@/lib/cafeteria";

export async function GET() {
  const settings = await getCafeteriaSettings();
  return NextResponse.json({ enabled: settings.enabled });
}
