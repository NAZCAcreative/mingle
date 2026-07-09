"use client";

import { useState } from "react";
import type { Gender, UserProfile } from "@/hooks/useNickname";

const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "other", label: "기타" }
];

export function NicknameModal({ onSave }: { onSave: (profile: UserProfile) => void }) {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  return (
    <div className="rounded-card border border-blush bg-white p-4 shadow-card">
      <p className="text-lg font-black text-ink">입장하려면 닉네임과 성별을 입력해 주세요</p>
      <form
        className="mt-3 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (nickname.trim() && gender) onSave({ nickname: nickname.trim(), gender });
        }}
      >
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={16}
          placeholder="닉네임"
          className="h-[52px] w-full rounded-button border border-blush bg-cream px-4 text-[16px] font-bold outline-none focus:border-mingle"
        />
        <div className="grid grid-cols-3 gap-2">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGender(option.value)}
              className={`h-[52px] rounded-button text-[16px] font-black ${
                gender === option.value ? "bg-mingle text-white" : "bg-cream text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button disabled={!nickname.trim() || !gender} className="h-[54px] w-full rounded-button bg-mingle text-[17px] font-black text-white disabled:bg-neutral-300">
          입장
        </button>
      </form>
    </div>
  );
}
