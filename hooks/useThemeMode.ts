"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "default" | "blue" | "green";

const key = "mingle_theme";

export const themeOptions: Array<{ value: ThemeMode; label: string; description: string }> = [
  { value: "default", label: "기본", description: "따뜻한 핑크 톤" },
  { value: "blue", label: "블루 모범생", description: "차분한 집중 모드" },
  { value: "green", label: "그린 차분", description: "편안한 협업 모드" }
];

export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>("default");

  useEffect(() => {
    const saved = localStorage.getItem(key) as ThemeMode | null;
    const nextTheme = saved && themeOptions.some((option) => option.value === saved) ? saved : "default";
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
