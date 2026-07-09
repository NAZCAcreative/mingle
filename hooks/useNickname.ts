"use client";

import { useEffect, useMemo, useState } from "react";

export type Gender = "male" | "female" | "other";

export type UserProfile = {
  nickname: string;
  gender: Gender | "";
};

const key = "mingle_profile";

export const genderLabels: Record<Gender, string> = {
  male: "남성",
  female: "여성",
  other: "기타"
};

export function useNickname() {
  const [profile, setProfileState] = useState<UserProfile>({ nickname: "", gender: "" });

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as UserProfile;
      setProfileState({ nickname: parsed.nickname ?? "", gender: parsed.gender ?? "" });
    } catch {
      setProfileState({ nickname: localStorage.getItem("mingle_nickname") ?? "", gender: "" });
    }
  }, []);

  const setProfile = (value: UserProfile) => {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem("mingle_nickname", value.nickname);
    setProfileState(value);
  };

  const displayName = useMemo(() => {
    if (!profile.nickname || !profile.gender) return "";
    return `${profile.nickname} (${genderLabels[profile.gender]})`;
  }, [profile]);

  return {
    nickname: profile.nickname,
    gender: profile.gender,
    profile,
    displayName,
    ready: Boolean(profile.nickname && profile.gender),
    setProfile
  };
}
