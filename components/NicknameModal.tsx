"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Gender, UserProfile } from "@/hooks/useNickname";

const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "other", label: "기타" }
];

type NicknameModalProps = {
  initialProfile?: UserProfile;
  title?: string;
  submitLabel?: string;
  onCancel?: () => void;
  onSave: (profile: UserProfile) => void;
};

export function NicknameModal({ initialProfile, title, submitLabel = "입장", onCancel, onSave }: NicknameModalProps) {
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? "");
  const [gender, setGender] = useState<Gender | "">(initialProfile?.gender ?? "");

  useEffect(() => {
    setNickname(initialProfile?.nickname ?? "");
    setGender(initialProfile?.gender ?? "");
  }, [initialProfile]);

  return (
    <div className="rounded-card border border-blush bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-semibold text-ink">{title ?? "입장하려면 닉네임과 성별을 입력해 주세요"}</p>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-mingle"
            aria-label="닫기"
            title="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
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
          className="h-[52px] w-full rounded-button border border-blush bg-cream px-4 text-[16px] font-medium outline-none focus:border-mingle"
        />
        <div className="grid grid-cols-3 gap-2">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGender(option.value)}
              className={`h-[52px] rounded-button text-[16px] font-semibold ${
                gender === option.value ? "bg-mingle text-white" : "bg-cream text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={onCancel ? "grid grid-cols-2 gap-2" : ""}>
          {onCancel ? (
            <button type="button" onClick={onCancel} className="h-[54px] rounded-button bg-cream text-[17px] font-semibold text-ink">
              취소
            </button>
          ) : null}
          <button disabled={!nickname.trim() || !gender} className="h-[54px] w-full rounded-button bg-mingle text-[17px] font-semibold text-white disabled:bg-neutral-300">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
