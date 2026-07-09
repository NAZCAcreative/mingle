"use client";

import { ArrowDownWideNarrow, Check, Flame, MessageCircle, Timer, UsersRound } from "lucide-react";
import { useState } from "react";
import type { RoomSortMode } from "@/hooks/useRooms";

const sortOptions: Array<{
  value: RoomSortMode;
  label: string;
  icon: typeof Flame;
}> = [
  { value: "latest", label: "최신순", icon: Flame },
  { value: "active", label: "활발한 대화순", icon: MessageCircle },
  { value: "closing", label: "마감 임박순", icon: Timer },
  { value: "popular", label: "인원 많은순", icon: UsersRound }
];

export function SortMenu({ value, onChange }: { value: RoomSortMode; onChange: (value: RoomSortMode) => void }) {
  const [open, setOpen] = useState(false);
  const selected = sortOptions.find((option) => option.value === value) ?? sortOptions[0];

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="flex h-[52px] w-full min-w-[120px] items-center justify-center gap-2 rounded-button bg-white px-4 text-[16px] font-semibold text-ink shadow-card"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ArrowDownWideNarrow className="h-5 w-5 shrink-0 text-mingle" />
        <span className="truncate">{selected.label}</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-2 min-w-48 overflow-hidden rounded-card border border-blush bg-white py-1 shadow-card" role="menu">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex h-[50px] w-full items-center gap-2 px-4 text-left text-[16px] font-semibold ${
                  active ? "bg-blush text-mingle" : "text-ink hover:bg-blush"
                }`}
                role="menuitem"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {active ? <Check className="h-5 w-5 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
