"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "default" | "blue" | "green";

const key = "mingle_theme";

export const themeOptions: Array<{ value: ThemeMode; label: string; description: string }> = [
  { value: "blue", label: "블루 모범생", description: "차분한 집중 모드 (기본)" },
  { value: "default", label: "핑크핑크", description: "따뜻한 핑크 톤" },
  { value: "green", label: "그린 차분", description: "편안한 협업 모드" }
];

export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>("blue");

  useEffect(() => {
    const saved = localStorage.getItem(key) as ThemeMode | null;
    const nextTheme = saved && themeOptions.some((option) => option.value === saved) ? saved : "blue";
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const setTheme = (value: ThemeMode) => {
    localStorage.setItem(key, value);
    applyTheme(value);
    setThemeState(value);
  };

  return { theme, setTheme };
}

function applyTheme(value: ThemeMode) {
  if (value === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = value;
  }
}
