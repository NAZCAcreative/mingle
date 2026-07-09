import { getServerSupabase } from "@/lib/supabase/server";
import { parseKoreanSentAtText } from "@/lib/time";
import { analyzeMessage } from "@/services/aiService";
import { hasLocalIngested, latestLocalIngestedId, markLocalIngested } from "@/services/localStore";
import { upsertRoomFromAnalysis } from "@/services/roomService";
import type { AiAnalysis } from "@/types/ai";

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

const COMMENT_ANALYSIS: AiAnalysis = {
  is_actionable: false,
  type: "ignore",
  category: "etc",
  title: "",
  summary: "댓글은 방 생성 대상이 아닙니다.",
  origin: null,
  destination: null,
  meeting_time_text: null,
  current_people: 0,
  max_people: null,
  keywords: [],
  merge_key: "",
  confidence: 1
};

export async function ingestChats() {
  const supabase = getServerSupabase();
  const { data: latest } = supabase
    ? await supabase.from("ingested_chats").select("id").order("id", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const baseUrl = process.env.CHAT_SOURCE_URL || "https://dm.kggstudio.com/chats";
  const storedAfterId = latest?.id ?? latestLocalIngestedId();
  const latestWindowAfterId = await resolveLatestWindowAfterId(baseUrl, storedAfterId ?? 0);
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

    if (isCommentChat(chat)) {
      ignored += 1;

      if (supabase) {
        await supabase.from("ai_logs").insert({
          source_chat_id: id,
          raw_message: content,
          analysis: COMMENT_ANALYSIS,
          action: "ignored",
          room_id: null
        });
      }

      processed += 1;
      continue;
    }

    const analysis = await analyzeMessage(content);
    const room = await upsertRoomFromAnalysis(
      analysis,
      String(id),
      chat.sender ? String(chat.sender).trim() : null,
      chatCreatedAt,
      content
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
  const sentAt = parseKoreanSentAtText(chat.sent_at_text);
  if (sentAt) return sentAt;

  const createdAt = parseDateToIso(chat.created_at);
  if (createdAt) return createdAt;

  return new Date().toISOString();
}

function parseDateToIso(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isCommentChat(chat: SourceChat) {
  const record = chat as Record<string, unknown>;
  const parentIdFields = ["parent_id", "parentId", "parent_chat_id", "parentChatId", "reply_to_id", "replyToId"];
  const commentFlagFields = ["is_comment", "isComment", "is_reply", "isReply"];
  const messageTypeFields = ["type", "message_type", "messageType"];

  if (parentIdFields.some((field) => hasValue(record[field]))) return true;
  if (commentFlagFields.some((field) => isTrue(record[field]))) return true;

  return messageTypeFields.some((field) => {
    const value = String(record[field] ?? "").trim().toLowerCase();
    return value === "comment" || value === "reply";
  });
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "" && value !== 0 && value !== "0";
}

function isTrue(value: unknown) {
  return value === true || value === 1 || value === "1" || String(value).trim().toLowerCase() === "true";
}

async function fetchChatsAfter(baseUrl: string, afterId: number) {
  const response = await fetch(`${baseUrl}?after_id=${afterId}`, { cache: "no-store" });

  if (!response.ok) throw new Error(`chat source failed: ${response.status}`);

  return response;
}

// 피드의 마지막 id를 찾아, 최신 id - 200까지만 수집 대상으로 삼는다
const RECENT_WINDOW_SIZE = 200;

async function resolveLatestWindowAfterId(baseUrl: string, startFromId = 0) {
  let afterId = Math.max(100, startFromId);
  let lastId = afterId;

  for (let page = 0; page < 50; page += 1) {
    const response = await fetchChatsAfter(baseUrl, afterId);
    const payload = await response.json();
    const chats: SourceChat[] = Array.isArray(payload) ? payload : payload.items ?? payload.chats ?? payload.data ?? [];

    if (!chats.length) break;

    for (const chat of chats) {
      const id = Number(chat.id);
      if (id > lastId) lastId = id;
    }

    const nextAfterId = Number(chats.at(-1)?.id);
    if (!nextAfterId || chats.length < 500) break;
    afterId = nextAfterId;
  }

  return Math.max(100, lastId - RECENT_WINDOW_SIZE);
}
