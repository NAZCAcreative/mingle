"use client";

import { Crown, Link as LinkIcon, Users, X } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CountdownBadge } from "@/components/CountdownBadge";
import { categoryMeta } from "@/lib/constants";
import { cleanDisplayText } from "@/lib/text";
import { cleanRoomTitle } from "@/lib/title";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import type { Room } from "@/types/room";

export function RoomPreviewModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const meta = categoryMeta[room.category];
  const labels = useCategoryLabels();
  const cta = room.category === "life_question" ? "도와주기" : "입장하기";
  const href = `/room/${room.id}`;
  const place = cleanDisplayText(room.destination) || cleanDisplayText(room.origin);
  const summaryText = cleanDisplayText(room.summary);
  const showSummary = Boolean(summaryText && cleanRoomTitle(summaryText) !== room.title.trim());
  const maleCount = room.gender_counts?.male ?? 0;
  const femaleCount = room.gender_counts?.female ?? 0;
  const otherCount = room.gender_counts?.other ?? 0;
  const totalCount = room.participant_count ?? maleCount + femaleCount + otherCount;

  return (
    <div className="fixed inset-0 z-[1200] bg-ink/35 px-4 py-6" role="dialog" aria-modal="true" aria-label="방 정보">
      <div className="mx-auto mt-10 flex max-h-[calc(100vh-96px)] w-full max-w-[430px] flex-col overflow-hidden rounded-card bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-blush px-5 py-4">
          <div className="flex items-center gap-2">
            <span className={`grid h-9 w-9 place-items-center rounded-full ${meta.tint}`}>
              <CategoryIcon category={room.category} className={`h-5 w-5 ${meta.iconColor}`} />
            </span>
            <span className={`rounded-md px-2 py-1 text-[13px] font-light ${meta.badge}`}>{labels[room.category]}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-blush text-mingle"
            aria-label="닫기"
            title="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <h2 className="text-xl font-light leading-snug tracking-tight text-ink [font-family:var(--font-plex-kr)]">{room.title}</h2>

          {showSummary ? <p className="text-[15px] font-medium leading-relaxed text-muted">{summaryText}</p> : null}

          <div className="rounded-card bg-cream p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Users className="h-4 w-4 text-mingle" />
              참여 인원 {totalCount}명
            </p>
            <p className="mt-2 text-[15px] font-light">
              <span className="text-[#3B82F6]">남자 {maleCount}명</span>
              <span className="text-muted"> · </span>
              <span className="text-[#EC4899]">여자 {femaleCount}명</span>
              <span className="text-muted"> · 기타 {otherCount}명</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-light text-muted">
            <span className="rounded-xl bg-cream px-3 py-2">시간: {cleanDisplayText(room.meeting_time_text) || "미정"}</span>
            <span className="rounded-xl bg-cream px-3 py-2">장소: {place || "미정"}</span>
          </div>

          {room.owner_nickname ? (
            <p className="inline-flex items-center gap-1.5 rounded-md bg-blush px-2.5 py-1.5 text-sm font-semibold text-mingle">
              <Crown className="h-4 w-4" />
              방장 {room.owner_nickname}
            </p>
          ) : null}

          <CountdownBadge expireAt={room.expire_at} wide />

        </div>

        <div className="border-t border-blush px-5 py-4">
          <Link
            href={href}
            className={`font-cta flex h-[54px] w-full items-center justify-center gap-2 rounded-button text-[17px] font-semibold text-white shadow-soft ${
              cta === "도와주기" ? "bg-mingle" : "bg-success"
            }`}
          >
            <LinkIcon className="h-5 w-5" />
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
