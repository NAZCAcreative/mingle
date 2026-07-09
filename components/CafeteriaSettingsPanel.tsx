"use client";

import { useEffect, useState } from "react";
import type { CafeteriaManualMenu } from "@/lib/cafeteria";

type CafeteriaSettings = {
  enabled: boolean;
  manualMenu: CafeteriaManualMenu | null;
};

export function CafeteriaSettingsPanel({ actor }: { actor: string }) {
  const [settings, setSettings] = useState<CafeteriaSettings>({ enabled: false, manualMenu: null });
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [mealsText, setMealsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/admin/cafeteria?actor=${encodeURIComponent(actor)}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = await response.json() as CafeteriaSettings;
      setSettings(next);
      setDate(next.manualMenu?.date ?? today());
      setName(next.manualMenu?.name ?? "");
      setMealsText(formatMeals(next.manualMenu?.meals ?? []));
    };
    void load();
  }, [actor]);

  const save = async (manualMenu: CafeteriaManualMenu | null = createManualMenu(date, name, mealsText)) => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/cafeteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor, enabled: settings.enabled, manualMenu })
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(`저장 실패: ${json.error ?? response.status}`);
        return;
      }
      setSettings((current) => ({ ...current, manualMenu }));
      setMessage("저장했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-card border border-blush p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">오늘의 학식</h3>
          <p className="mt-1 text-xs font-medium text-muted">홈 화면 노출</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
            className="h-4 w-4 accent-mingle"
          />
          {settings.enabled ? "ON" : "OFF"}
        </label>
      </div>

      <div className="mt-4 space-y-2 border-t border-blush pt-4">
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 min-w-0 rounded-button border border-blush bg-cream px-3 text-sm outline-none focus:border-mingle" aria-label="수동 메뉴 날짜" />
          <input value={name} onChange={(event) => setName(event.target.value)} className="h-10 min-w-0 rounded-button border border-blush bg-cream px-3 text-sm outline-none focus:border-mingle" placeholder="식당명" aria-label="수동 메뉴 식당명" />
        </div>
        <textarea value={mealsText} onChange={(event) => setMealsText(event.target.value)} rows={4} className="w-full resize-y rounded-button border border-blush bg-cream px-3 py-2 text-sm leading-relaxed outline-none focus:border-mingle" placeholder={"중식 | 제육볶음, 된장국\n석식 | 돈까스, 우동"} aria-label="수동 메뉴" />
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => void save(null)} disabled={saving} className="h-9 px-2 text-sm font-medium text-muted disabled:text-neutral-300">수동 메뉴 비우기</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="h-10 rounded-button bg-mingle px-3 text-sm font-medium text-white disabled:bg-neutral-300">{saving ? "저장 중" : "저장"}</button>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs font-medium text-muted">{message}</p> : null}
    </section>
  );
}

function createManualMenu(date: string, name: string, mealsText: string): CafeteriaManualMenu | null {
  const meals = mealsText.split("\n").map((line) => {
    const [label, ...items] = line.split("|");
    return { label: label?.trim() ?? "", items: items.join("|").split(",").map((item) => item.trim()).filter(Boolean) };
  }).filter((meal) => meal.label && meal.items.length);

  return date && name.trim() && meals.length ? { date, name: name.trim(), meals } : null;
}

function formatMeals(meals: CafeteriaManualMenu["meals"]) {
  return meals.map((meal) => `${meal.label} | ${meal.items.join(", ")}`).join("\n");
}

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}
