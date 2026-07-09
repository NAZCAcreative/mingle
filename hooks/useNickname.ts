"use client";

import { useEffect, useMemo, useState } from "react";

export type Gender = "male" | "female" | "other";

export type UserProfile = {
  nickname: string;
  gender: Gender | "";
};

const key = "mingle_profile";
const profileEvent = "mingle_profile_changed";

export const genderLabels: Record<Gender, string> = {
  male: "남성",
  female: "여성",
  other: "기타"
};

export function useNickname() {
  const [profile, setProfileState] = useState<UserProfile>({ nickname: "", gender: "" });

  useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem(key);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved) as UserProfile;
        setProfileState({ nickname: parsed.nickname ?? "", gender: parsed.gender ?? "" });
      } catch {
        setProfileState({ nickname: localStorage.getItem("mingle_nickname") ?? "", gender: "" });
      }
    };

    loadProfile();
    window.addEventListener(profileEvent, loadProfile);
    window.addEventListener("storage", loadProfile);

    return () => {
      window.removeEventListener(profileEvent, loadProfile);
      window.removeEventListener("storage", loadProfile);
    };
  }, []);

  const setProfile = (value: UserProfile) => {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem("mingle_nickname", value.nickname);
    setProfileState(value);
    window.dispatchEvent(new Event(profileEvent));
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
