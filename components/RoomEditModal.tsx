"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { Room } from "@/types/room";

export function RoomEditModal({
  room,
  onClose,
  onSaved
}: {
  room: Room;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(room.title);
  const [summary, setSummary] = useState(room.summary);
  const [meetingTime, setMeetingTime] = useState(room.meeting_time_text ?? "");
  const [destination, setDestination] = useState(room.destination ?? "");
  const [maxPeople, setMaxPeople] = useState(room.max_people ? String(room.max_people) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    const response = await fetch("/api/rooms/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: room.id,
        nickname: room.owner_nickname,
        title: title.trim(),
        summary: summary.trim(),
        meeting_time_text: meetingTime.trim() || null,
        destination: destination.trim() || null,
        max_people: maxPeople.trim() ? Number(maxPeople) : null
      })
    });
    setSaving(false);

    if (!response.ok) {
      setError("방 정보를 수정할 수 없어요. 방장만 수정할 수 있습니다.");
      return;
    }

    await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-ink/35 px-4 py-6" role="dialog" aria-modal="true" aria-label="방 정보 수정">
      <div className="mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-[430px] flex-col overflow-hidden rounded-card bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-blush px-5 py-4">
          <h2 className="text-xl font-black text-ink">방 정보 수정</h2>
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
          <label className="block">
            <span className="text-sm font-black text-ink">방 제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={60}
              className="mt-1.5 h-[50px] w-full rounded-button border border-blush bg-cream px-4 font-bold text-ink outline-none focus:border-mingle"
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-ink">요약</span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={200}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-button border border-blush bg-cream px-4 py-3 font-bold text-ink outline-none focus:border-mingle"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-black text-ink">시간</span>
              <input
                value={meetingTime}
                onChange={(event) => setMeetingTime(event.target.value)}
                maxLength={40}
                placeholder="예: 오늘 19:30"
                className="mt-1.5 h-[50px] w-full rounded-button border border-blush bg-cream px-4 font-bold text-ink outline-none focus:border-mingle"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black text-ink">장소</span>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                maxLength={40}
                placeholder="예: 제주대 후문"
                className="mt-1.5 h-[50px] w-full rounded-button border border-blush bg-cream px-4 font-bold text-ink outline-none focus:border-mingle"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-black text-ink">최대 인원</span>
            <input
              value={maxPeople}
              onChange={(event) => setMaxPeople(event.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="비워두면 제한 없음"
              className="mt-1.5 h-[50px] w-full rounded-button border border-blush bg-cream px-4 font-bold text-ink outline-none focus:border-mingle"
            />
          </label>

          {error ? <p className="text-sm font-bold text-mingle">{error}</p> : null}
        </div>

        <div className="border-t border-blush px-5 py-4">
          <button
            type="button"
            onClick={save}
            disabled={!title.trim() || saving}
            className="h-[54px] w-full rounded-button bg-mingle text-[17px] font-black text-white disabled:bg-neutral-300"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
