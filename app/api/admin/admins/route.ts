import { NextRequest, NextResponse } from "next/server";
import { isAdminNickname, listAdminNicknames, normalizeAdminNickname, saveAdminNicknames } from "@/lib/admins";

export async function GET() {
  return NextResponse.json({ admins: await listAdminNicknames() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const actor = normalizeAdminNickname(String(body.actor ?? ""));
  const nickname = normalizeAdminNickname(String(body.nickname ?? ""));

  if (!(await isAdminNickname(actor))) {
    return NextResponse.json({ error: "admin_only" }, { status: 403 });
  }

  if (!nickname) {
    return NextResponse.json({ error: "nickname is required" }, { status: 400 });
  }

  const currentAdmins = await listAdminNicknames();
  const result = await saveAdminNicknames([...currentAdmins, nickname]);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ admins: result.admins });
}
