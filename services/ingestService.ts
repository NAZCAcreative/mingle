import { getServerSupabase } from "@/lib/supabase/server";
import { analyzeMessage } from "@/services/aiService";
import { hasLocalIngested, latestLocalIngestedId, markLocalIngested } from "@/services/localStore";
import { upsertRoomFromAnalysis } from "@/services/roomService";

type SourceChat = {
  id: number;
  room?: string;
  content?: string;
  message?: string;
  text?: string;
  raw?: string;
  sender?: string;
  created_at?: string;
  sent_at_text?: string;
  [key: string]: unknown;
};

const INGEST_BATCH_SIZE = 60;

export async function ingestChats() {
  const supabase = getServerSupabase();
  const { data: latest } = supabase
    ? await supabase.from("ingested_chats").select("id").order("id", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const baseUrl = process.env.CHAT_SOURCE_URL || "https://dm.kggstudio.com/chats";
  const storedAfterId = latest?.id ?? latestLocalIngestedId();
  const latestWindowAfterId = await resolveLatestWindowAfterId(baseUrl);
  const afterId = storedAfterId ? Math.max(storedAfterId, latestWindowAfterId) : latestWindowAfterId;
  const response = await fetchChatsAfter(baseUrl, afterId);

  if (!response.ok) throw new Error(`chat source failed: ${response.status}`);

  const payload = await response.json();
  const receivedChats: SourceChat[] = Array.isArray(payload) ? payload : payload.items ?? payload.chats ?? payload.data ?? [];
  const chats = receivedChats.slice(0, INGEST_BATCH_SIZE);
  let processed = 0;
  let upserted = 0;
  let ignored = 0;

  for (const chat of chats) {
    const id = Number(chat.id);
    const content = String(chat.content ?? chat.message ?? chat.text ?? "").trim();
    const chatCreatedAt = resolveChatCreatedAt(chat);
    if (!id || !content) continue;
    if (!supabase && hasLocalIngested(id)) continue;

    if (supabase) {
      const { error: insertError } = await supabase.from("ingested_chats").upsert({
        id,
        raw: chat,
        content,
        sender: chat.sender ?? null,
        created_at: chatCreatedAt
      });
      if (insertError) throw insertError;
    } else {
      markLocalIngested(id);
    }

    const analysis = await analyzeMessage(content);
    const room = await upsertRoomFromAnalysis(
      analysis,
      String(id),
      chat.sender ? String(chat.sender).trim() : null,
      chatCreatedAt
    );
    const action = !analysis.is_actionable || analysis.type === "ignore" ? "ignored" : room ? "upserted" : "skipped";

    if (action === "upserted") upserted += 1;
    if (action === "ignored") ignored += 1;

    if (supabase) {
      await supabase.from("ai_logs").insert({
        source_chat_id: id,
        raw_message: content,
        analysis,
        action,
        room_id: room?.id ?? null
      });
    }

    processed += 1;
  }

  return { ok: true, processed, upserted, ignored, after_id: afterId, received: receivedChats.length, selected: chats.length };
}

function resolveChatCreatedAt(chat: SourceChat) {
  const createdAt = parseDateToIso(chat.created_at);
  if (createdAt) return createdAt;

  const sentAt = parseKoreanSentAtText(chat.sent_at_text);
  if (sentAt) return sentAt;

  return new Date().toISOString();
}

function parseDateToIso(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseKoreanSentAtText(value?: string) {
  if (!value) return null;

  const match = value.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?(오전|오후)\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const [, year, month, day, meridiem, hourText, minuteText] = match;
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (meridiem === "오전" && hour === 12) hour = 0;
  if (meridiem === "오후" && hour < 12) hour += 12;

  const kstTime = Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 9, minute);
  return new Date(kstTime).toISOString();
}

async function fetchChatsAfter(baseUrl: string, afterId: number) {
  const response = await fetch(`${baseUrl}?after_id=${afterId}`, { cache: "no-store" });

  if (!response.ok) throw new Error(`chat source failed: ${response.status}`);

  return response;
}

async function resolveLatestWindowAfterId(baseUrl: string) {
  let afterId = 100;
  const ids: number[] = [];

  for (let page = 0; page < 50; page += 1) {
    const response = await fetchChatsAfter(baseUrl, afterId);
    const payload = await response.json();
    const chats: SourceChat[] = Array.isArray(payload) ? payload : payload.items ?? payload.chats ?? payload.data ?? [];

    if (!chats.length) break;

    for (const chat of chats) {
      const id = Number(chat.id);
      if (id) ids.push(id);
    }

    const nextAfterId = Number(chats.at(-1)?.id);
    if (!nextAfterId || chats.length < 500) break;
    afterId = nextAfterId;
  }

  const sortedIds = ids.sort((a, b) => a - b);
  const firstLatestId = sortedIds.at(-500);
  return firstLatestId ? Math.max(100, firstLatestId - 1) : 100;
}
