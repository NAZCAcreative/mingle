"use client";

import { Loader2, Soup, X } from "lucide-react";
import { useState } from "react";

type Meal = {
  label: string;
  items: string[];
};

type CafeteriaMenu = {
  name: string;
  date: string;
  meals: Meal[];
  sourceUrl: string;
  error?: string;
};

type CafeteriaResponse = {
  date: string;
  menus: CafeteriaMenu[];
  source: string;
};

export function CafeteriaMenuButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CafeteriaResponse | null>(null);
  const [error, setError] = useState("");

  const openMenu = async () => {
    setOpen(true);
    if (data || loading) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cafeteria", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData(await response.json());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border-t border-blush bg-cream/95 px-4 pb-3">
        <button
          type="button"
          onClick={() => void openMenu()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-button bg-white text-[15px] font-semibold text-mingle shadow-card"
        >
          <Soup className="h-4 w-4" />
          오늘의 학식
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[1200] bg-ink/35 px-4 py-6" role="dialog" aria-modal="true" aria-label="오늘의 학식">
          <div className="mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-[430px] flex-col overflow-hidden rounded-card bg-white shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-blush px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-xl text-mingle [font-family:var(--font-gugi)]">오늘의 학식</h2>
                <p className="mt-0.5 text-xs font-medium text-muted">{data?.date ?? "오늘"} · 제주대학교 금주의메뉴</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush text-mingle"
                aria-label="닫기"
                title="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-[220px] overflow-y-auto px-4 py-4">
              {loading ? (
                <div className="grid min-h-[180px] place-items-center text-muted">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-mingle" />
                    <p className="mt-3 text-sm font-medium">학식 메뉴를 불러오는 중</p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-card bg-cream px-4 py-5 text-center text-sm font-medium text-muted">
                  메뉴를 불러오지 못했습니다. {error}
                </div>
              ) : data?.menus.length ? (
                <div className="space-y-3">
                  {data.menus.map((menu) => (
                    <section key={menu.name} className="rounded-card border border-blush bg-cream/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="min-w-0 truncate text-[16px] font-semibold text-ink">{menu.name}</h3>
                        <a
                          href={menu.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-xs font-medium text-mingle underline underline-offset-2"
                        >
                          원문
                        </a>
                      </div>

                      {menu.error ? (
                        <p className="mt-3 rounded-xl bg-white px-3 py-3 text-sm font-medium text-muted">불러오기 실패: {menu.error}</p>
                      ) : menu.meals.length ? (
                        <div className="mt-3 space-y-2">
                          {menu.meals.map((meal) => (
                            <div key={meal.label} className="rounded-xl bg-white px-3 py-3 shadow-card">
                              <p className="text-sm font-semibold text-mingle">{meal.label}</p>
                              {meal.items.length ? (
                                <ul className="mt-2 space-y-1 text-[14px] font-medium leading-relaxed text-ink">
                                  {meal.items.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 text-sm font-medium text-muted">메뉴 정보가 없습니다.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 rounded-xl bg-white px-3 py-3 text-sm font-medium text-muted">오늘 메뉴가 없습니다.</p>
                      )}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="rounded-card bg-cream px-4 py-5 text-center text-sm font-medium text-muted">표시할 메뉴가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
