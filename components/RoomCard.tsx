"use client";

import { Check, Copy, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CountdownBadge } from "@/components/CountdownBadge";
import { RoomPreviewModal } from "@/components/RoomPreviewModal";
import { categoryMeta } from "@/lib/constants";
import { formatChatAt } from "@/lib/time";
import type { Room } from "@/types/room";

export function RoomCard({ room }: { room: Room }) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const meta = categoryMeta[room.category];
  const isQuestion = room.status === "answering";
  const cta = room.category === "life_question" ? "도와주기" : "입장하기";
  const href = `/room/${room.id}`;
  const place = room.destination || room.origin;
  const maleCount = room.gender_counts?.male ?? 0;
  const femaleCount = room.gender_counts?.female ?? 0;
  const otherCount = room.gender_counts?.other ?? 0;
  const detailParts = [isQuestion ? null : room.meeting_time_text, place].filter(Boolean);

  const copyLink = async () => {
    const url = `${window.location.origin}${href}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <article className="rounded-card border border-blush bg-white p-4 shadow-card">
      <button type="button" onClick={() => setPreviewOpen(true)} className="block w-full text-left" aria-label="방 정보 보기">
        <div className="grid grid-cols-[86px_1fr] gap-3">
          <div className={`grid h-[76px] w-[76px] place-items-center rounded-full ${meta.tint}`}>
            <CategoryIcon category={room.category} className="h-10 w-10 text-mingle" />
          </div>
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className={`flex h-[34px] items-center rounded-md px-2.5 text-[13px] font-black ${meta.badge}`}>{meta.label}</span>
              <span className="flex h-[34px] shrink-0 items-center rounded-md border border-neutral-100 bg-neutral-50 px-2.5 text-[13px] font-black text-neutral-600">
                {formatChatAt(room.last_message_at)}
              </span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-[20px] font-black leading-snug text-ink">{room.title}</h3>
            <p className="mt-2 line-clamp-1 text-[15px] font-bold text-muted">
              <span className="text-[#3B82F6]">남자 {maleCount}명</span>
              {" · "}
              <span className="text-mingle">여자 {femaleCount}명</span>
              {` · 기타 ${otherCount}명`}
              {detailParts.length ? ` · ${detailParts.join(" · ")}` : null}
            </p>
          </div>
        </div>
      </button>

      <div className="mt-4 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <CountdownBadge expireAt={room.expire_at} wide />
        </div>
        <div className="shrink-0 text-right">
          <Link
            className={`flex h-[56px] min-w-[116px] items-center justify-center gap-2 rounded-button px-4 text-[17px] font-black text-white shadow-soft ${
              cta === "도와주기" ? "bg-mingle" : "bg-success"
            }`}
            href={href}
          >
            <LinkIcon className="h-5 w-5" />
            {cta}
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={copyLink}
        className="mt-3 flex h-[46px] w-full items-center justify-center gap-2 rounded-button bg-blush px-4 text-[15px] font-black text-mingle"
        aria-label="방 링크 복사"
        title="방 링크 복사"
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
        {copied ? "링크 복사됨" : "방 링크 복사"}
      </button>

      {previewOpen ? <RoomPreviewModal room={room} onClose={() => setPreviewOpen(false)} /> : null}
    </article>
  );
}
