"use client";

import { useEffect, useState } from "react";
import { categoryMeta } from "@/lib/constants";
import type { Category } from "@/types/room";

const defaults = Object.fromEntries(
  Object.entries(categoryMeta).map(([key, meta]) => [key, meta.label])
) as Record<Category, string>;

let cached: Record<Category, string> | null = null;

export function useCategoryLabels() {
  const [labels, setLabels] = useState<Record<Category, string>>(cached ?? defaults);

  useEffect(() => {
    if (cached) return;
    let active = true;

    fetch("/api/categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => {
        if (!json?.labels) return;
        const merged = { ...defaults, ...json.labels } as Record<Category, string>;
        cached = merged;
        if (active) setLabels(merged);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return labels;
}
