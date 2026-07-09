"use client";

import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryChips } from "@/components/CategoryChips";
import { EmptyState } from "@/components/EmptyState";
import { HeroCard } from "@/components/HeroCard";
import { RoomList } from "@/components/RoomList";
import { SortMenu } from "@/components/SortMenu";
import { useRooms } from "@/hooks/useRooms";

const PAGE_SIZE = 6;

export default function HomePage() {
  const { rooms, loading, category, setCategory, sortMode, setSortMode, reload } = useRooms();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const filteredRooms = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rooms;
    return rooms.filter((room) => room.title.toLowerCase().includes(keyword));
  }, [rooms, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRooms = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRooms.slice(start, start + PAGE_SIZE);
  }, [filteredRooms, currentPage]);

  const ingest = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const changeCategory = (nextCategory: Parameters<typeof setCategory>[0]) => {
    setCategory(nextCategory);
    setPage(1);
  };

  return (
    <main className="pb-7">
      <CategoryChips selected={category} onSelect={changeCategory} />

      <section className="mt-4">
        <div className="mx-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-light tracking-tight text-ink [font-family:var(--font-plex-kr)]">지금 열린 방</h2>
            {!loading && filteredRooms.length > 0 ? <p className="mt-1 text-sm font-medium text-muted">총 {filteredRooms.length}개 · {currentPage}/{totalPages}페이지</p> : null}
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SortMenu value={sortMode} onChange={setSortMode} />
            <button
              onClick={ingest}
              disabled={refreshing}
              className="flex h-[52px] min-w-[120px] items-center justify-center gap-2 rounded-button bg-white px-4 text-[16px] font-semibold text-muted shadow-card"
            >
              새로고침 <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <label className="mx-4 mt-3 flex h-[48px] items-center gap-2 rounded-full border border-blush bg-white px-4 shadow-card focus-within:border-mingle">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (!nextQuery.trim()) setSortMode("latest");
              setPage(1);
            }}
            placeholder="방 제목 검색"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-normal outline-none placeholder:text-muted"
            aria-label="방 검색"
          />
        </label>

        {loading ? (
          <div className="mx-4 mt-4 rounded-card bg-white p-6 text-center shadow-card">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-mingle" />
            <p className="mt-3 font-semibold text-muted">방을 찾는 중이에요</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-blush">
              <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-mingle" />
            </div>
          </div>
        ) : pagedRooms.length ? (
          <>
            <div key={`${category}-${sortMode}-${currentPage}`} className="page-slide">
              <RoomList rooms={pagedRooms} />
            </div>
            {filteredRooms.length > PAGE_SIZE ? (
              <div className="mx-4 mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage <= 1}
                  className="flex h-[52px] min-w-[120px] items-center justify-center gap-2 rounded-button bg-white px-4 text-[16px] font-semibold text-ink shadow-card disabled:text-neutral-300"
                >
                  <ChevronLeft className="h-5 w-5" />
                  이전
                </button>
                <span className="text-sm font-semibold text-muted">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex h-[52px] min-w-[120px] items-center justify-center gap-2 rounded-button bg-mingle px-4 text-[16px] font-semibold text-white shadow-soft disabled:bg-neutral-300"
                >
                  다음
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState />
        )}
      </section>

      <HeroCard />

      <footer className="mx-4 mt-8 border-t border-blush pb-2 pt-5 text-center">
        <p className="text-sm font-light text-muted">
          제안·건의 : 카카오톡 ID <span className="font-normal text-ink">nazcq</span>
        </p>
        <p className="mt-1 text-xs font-light text-muted">© 2026 교류방 feat. 모두연. All rights reserved.</p>
      </footer>
    </main>
  );
}
