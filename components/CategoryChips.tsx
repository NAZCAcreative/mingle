"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { visibleCategories } from "@/lib/constants";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import type { Category } from "@/types/room";

export function CategoryChips({ selected, onSelect }: { selected: Category; onSelect: (category: Category) => void }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const labels = useCategoryLabels();

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 112, behavior: "smooth" });
  };

  const scrollPrev = () => {
    scrollRef.current?.scrollBy({ left: -112, behavior: "smooth" });
  };

  return (
    <div className="relative mt-5">
      <div ref={scrollRef} className="no-scrollbar mx-4 flex snap-x gap-3 overflow-x-auto scroll-smooth pb-1 pl-14 pr-16">
        {visibleCategories.map((category) => {
          const active = selected === category;
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`flex h-[96px] min-w-[96px] snap-start flex-col items-center justify-center gap-2 rounded-[18px] border text-[16px] font-normal shadow-card transition ${
                active ? "border-blush bg-blush text-mingle" : "border-blush bg-white text-ink"
              }`}
            >
              <CategoryIcon category={category} className="h-8 w-8" />
              {labels[category]}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-mingle shadow-card"
        aria-label="이전 카테고리 보기"
        title="이전 카테고리 보기"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>

      <button
        type="button"
        onClick={scrollNext}
        className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-mingle shadow-card"
        aria-label="다음 카테고리 보기"
        title="다음 카테고리 보기"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
    </div>
  );
}
