"use client";

import { Bell, Check, HelpCircle, Palette, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Mascot } from "@/components/Mascot";
import { themeOptions, useThemeMode } from "@/hooks/useThemeMode";

export function Header() {
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const { theme, setTheme } = useThemeMode();

  return (
    <header className="sticky top-0 z-[1000] border-b border-blush bg-cream/95 px-4 py-3 backdrop-blur">
      <nav className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="홈으로 이동">
          <Mascot size="sm" />
          <div className="min-w-0">
            <h1 className="text-[30px] font-black leading-none tracking-normal text-mingle">mingle</h1>
            <p className="mt-1 truncate text-[13px] font-bold text-muted">대화가 모임이 되는 순간</p>
          </div>
        </Link>

        <div className="relative flex shrink-0 items-center gap-2">
          <button className="grid h-11 w-11 place-items-center rounded-button bg-white text-mingle shadow-card" aria-label="알림" title="알림">
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setGuideOpen(true);
              setOpen(false);
            }}
            className="grid h-11 w-11 place-items-center rounded-button bg-white text-mingle shadow-card"
            aria-label="이용 안내"
            title="이용 안내"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-11 w-11 place-items-center rounded-button bg-mingle text-white shadow-soft"
            aria-label="컨셉 설정"
            title="컨셉 설정"
          >
            <Palette className="h-5 w-5" />
          </button>

          {open ? (
            <div className="absolute right-0 top-[52px] z-40 w-56 overflow-hidden rounded-card border border-blush bg-white p-2 shadow-card">
              <p className="px-3 py-2 text-sm font-black text-ink">컨셉 변경</p>
              {themeOptions.map((option) => {
                const active = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setTheme(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left ${
                      active ? "bg-blush text-mingle" : "text-ink hover:bg-blush"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-black">{option.label}</span>
                      <span className="mt-0.5 block text-xs font-bold text-muted">{option.description}</span>
                    </span>
                    {active ? <Check className="h-5 w-5 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>

      {guideOpen ? (
        <div className="fixed inset-0 z-[1200] bg-ink/35 px-4 py-6" role="dialog" aria-modal="true" aria-label="Mingle 이용 안내">
          <div className="mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-[430px] flex-col overflow-hidden rounded-card bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-blush px-5 py-4">
              <h2 className="text-xl font-black text-ink">Mingle 이용 안내</h2>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-blush text-mingle"
                aria-label="닫기"
                title="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-4 text-[15px] font-semibold leading-relaxed text-ink">
              <section>
                <h3 className="text-base font-black text-mingle">AI가 제주대 학점교류방 글을 분석합니다.</h3>
                <p className="mt-2 text-muted">
                  제주대 학점교류방에 올라온 게시글을 AI가 분석하여 같은 목적의 사람들과 즉석 채팅방을 자동으로 생성합니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-black text-mingle">이용 방법</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>원하는 방을 선택하여 바로 참여할 수 있습니다.</li>
                  <li>현재는 로그인 없이 이용 가능합니다.</li>
                  <li>회원 기능은 추후 추가될 예정입니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-black text-mingle">방장 등록</h3>
                <p className="mt-2 text-muted">게시글 작성자의 닉네임과 방 참가 닉네임이 일치하면 자동으로 방장으로 등록됩니다.</p>
              </section>

              <section>
                <h3 className="text-base font-black text-mingle">방 자동 삭제(방폭)</h3>
                <p className="mt-2 text-muted">활동 중인 방만 유지하기 위해 자동 삭제 기능이 적용됩니다.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>마지막 대화 후 6시간 동안 대화가 없으면 방이 자동 삭제됩니다.</li>
                  <li>새로운 대화가 발생하면 6시간이 다시 연장됩니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-black text-mingle">방 이용 안내</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>목적에 맞는 방에만 참여해 주세요.</li>
                  <li>시간, 장소가 변경되면 채팅으로 공유해 주세요.</li>
                  <li>모임이 종료되면 방은 자동으로 정리됩니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-black text-mingle">신고 및 이용 제한</h3>
                <p className="mt-2 text-muted">다음과 같은 행위는 서비스 이용이 제한될 수 있습니다.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>욕설 및 비방</li>
                  <li>광고·홍보</li>
                  <li>사기 및 금전 요구</li>
                  <li>음란물 및 불법 게시물</li>
                  <li>반복 도배</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-black text-mingle">개인정보 안내</h3>
                <p className="mt-2 text-muted">전화번호, 계좌번호 등 개인정보는 필요한 경우에만 직접 공유해 주세요.</p>
              </section>

              <section>
                <h3 className="text-base font-black text-mingle">Beta 서비스</h3>
                <p className="mt-2 text-muted">
                  현재 Mingle은 베타 서비스입니다. 더 편리한 이용을 위해 로그인, 알림, 친구 기능 등 다양한 기능이 순차적으로 추가될 예정입니다.
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
