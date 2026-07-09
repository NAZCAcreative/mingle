"use client";

import { Bell, Check, HelpCircle, LogOut, Palette, ShieldCheck, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CafeteriaMenuButton } from "@/components/CafeteriaMenuButton";
import { NicknameModal } from "@/components/NicknameModal";
import { removeJoinedRoom, useMyChatRooms } from "@/hooks/useMyChatRooms";
import { useNickname } from "@/hooks/useNickname";
import { themeOptions, useThemeMode } from "@/hooks/useThemeMode";

export function Header() {
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { theme, setTheme } = useThemeMode();
  const { displayName, profile, setProfile } = useNickname();
  const { alerts, unreadTotal, refreshAlerts } = useMyChatRooms(displayName);
  const [adminNames, setAdminNames] = useState(["나스큐"]);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await fetch("/api/admin/admins", { cache: "no-store" });
        const json = await response.json();
        if (Array.isArray(json.admins) && json.admins.length) setAdminNames(json.admins);
      } catch {
        // Keep the fallback admin nickname available offline.
      }
    };
    void loadAdmins();
  }, []);

  const leaveJoinedRoom = async (roomId: string) => {
    if (!profile.nickname) return;
    if (!window.confirm("방에서 나가시겠어요?")) return;

    await fetch("/api/rooms/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, nickname: profile.nickname })
    });
    removeJoinedRoom(roomId);
    await refreshAlerts();
    setNotificationsOpen(false);
  };

  return (
    <header className="sticky top-0 z-[1000] border-b border-blush bg-cream/95 backdrop-blur">
      <nav className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center" aria-label="홈으로 이동">
          <h1 className="text-[30px] leading-none text-mingle [font-family:var(--font-gugi)]">교류방</h1>
        </Link>

        <div className="relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((value) => !value);
              setOpen(false);
              setGuideOpen(false);
              setProfileOpen(false);
            }}
            className="relative grid h-11 w-11 place-items-center rounded-button bg-white text-mingle shadow-card"
            aria-label={unreadTotal > 0 ? `알림 ${unreadTotal}개` : "알림"}
            title={unreadTotal > 0 ? `알림 ${unreadTotal}개` : "알림"}
          >
            <Bell className="h-5 w-5" />
            {unreadTotal > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-success px-1 text-[11px] font-semibold text-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => {
              setGuideOpen(true);
              setOpen(false);
              setProfileOpen(false);
              setNotificationsOpen(false);
            }}
            className="grid h-11 w-11 place-items-center rounded-button bg-white text-mingle shadow-card"
            aria-label="이용 안내"
            title="이용 안내"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(true);
              setOpen(false);
              setGuideOpen(false);
              setNotificationsOpen(false);
            }}
            className="grid h-11 w-11 place-items-center rounded-button bg-white text-mingle shadow-card"
            aria-label={profile.nickname ? `닉네임 변경: ${profile.nickname}` : "닉네임 설정"}
            title={profile.nickname ? `닉네임 변경: ${profile.nickname}` : "닉네임 설정"}
          >
            <UserRound className="h-5 w-5" />
          </button>
          {adminNames.includes(profile.nickname.trim()) ? (
            <Link
              href="/admin"
              className="grid h-11 w-11 place-items-center rounded-button bg-white text-mingle shadow-card"
              aria-label="관리자"
              title="관리자"
            >
              <ShieldCheck className="h-5 w-5" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setOpen((value) => !value);
              setProfileOpen(false);
              setNotificationsOpen(false);
            }}
            className="grid h-11 w-11 place-items-center rounded-button bg-mingle text-white shadow-soft"
            aria-label="컨셉 설정"
            title="컨셉 설정"
          >
            <Palette className="h-5 w-5" />
          </button>

          {notificationsOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setNotificationsOpen(false)}
                aria-label="알림 닫기"
                tabIndex={-1}
              />
              <div className="absolute right-0 top-[52px] z-40 w-72 overflow-hidden rounded-card border border-blush bg-white shadow-card">
              <div className="flex items-start justify-between gap-2 border-b border-blush px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">내 대화</p>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    참여 중인 방 {alerts.length}개{unreadTotal > 0 ? ` · 새 메시지 ${unreadTotal}개` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush text-mingle"
                  aria-label="닫기"
                  title="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto p-2">
                {alerts.length === 0 ? (
                  <p className="px-3 py-5 text-center text-sm font-medium text-muted">참여 중인 대화방이 없습니다.</p>
                ) : (
                  alerts.map((room) => (
                    <div key={room.id} className="rounded-[14px] px-3 py-3 hover:bg-blush">
                      <Link href={`/room/${room.id}`} onClick={() => setNotificationsOpen(false)} className="block text-left">
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-semibold text-ink">{room.title}</span>
                            <span className="mt-1 block truncate text-xs font-medium text-muted">
                              {room.latestMessage ? `${room.latestMessage.nickname}: ${room.latestMessage.content}` : "아직 대화가 없습니다"}
                            </span>
                          </span>
                          {room.unreadCount > 0 ? (
                            <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-success px-1.5 text-xs font-semibold text-white">
                              {room.unreadCount > 99 ? "99+" : room.unreadCount}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => void leaveJoinedRoom(room.id)}
                        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-button bg-white px-2.5 text-xs font-semibold text-muted shadow-card"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        방 나가기
                      </button>
                    </div>
                  ))
                )}
              </div>
              </div>
            </>
          ) : null}

          {open ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setOpen(false)}
                aria-label="컨셉 설정 닫기"
                tabIndex={-1}
              />
              <div className="absolute right-0 top-[52px] z-40 w-56 overflow-hidden rounded-card border border-blush bg-white p-2 shadow-card">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-sm font-semibold text-ink">컨셉 변경</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-blush text-mingle"
                  aria-label="닫기"
                  title="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
                      <span className="block text-[15px] font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-xs font-medium text-muted">{option.description}</span>
                    </span>
                    {active ? <Check className="h-5 w-5 shrink-0" /> : null}
                  </button>
                );
              })}
              </div>
            </>
          ) : null}
        </div>
      </nav>
      <CafeteriaMenuButton />

      {profileOpen ? (
        <div className="fixed inset-0 z-[1200] bg-ink/35 px-4 py-6" role="dialog" aria-modal="true" aria-label="닉네임 변경">
          <div className="mx-auto mt-16 w-full max-w-[430px]">
            <NicknameModal
              initialProfile={profile}
              title={profile.nickname ? "닉네임과 성별을 변경해 주세요" : "닉네임과 성별을 입력해 주세요"}
              submitLabel="저장"
              onCancel={() => setProfileOpen(false)}
              onSave={(nextProfile) => {
                setProfile(nextProfile);
                setProfileOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}

      {guideOpen ? (
        <div className="fixed inset-0 z-[1200] bg-ink/35 px-4 py-6" role="dialog" aria-modal="true" aria-label="교류방 이용 안내">
          <div className="mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-[430px] flex-col overflow-hidden rounded-card bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-blush px-5 py-4">
              <h2 className="text-xl text-mingle [font-family:var(--font-gugi)]">교류방 이용 안내</h2>
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
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">AI가 제주대 학점교류방 글을 분석합니다.</h3>
                <p className="mt-2 text-muted">
                  제주대 학점교류방에 올라온 게시글을 AI가 분석하여 같은 목적의 사람들과 즉석 채팅방을 자동으로 생성합니다.
                </p>
              </section>

              <section>
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">이용 방법</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>원하는 방을 선택하여 바로 참여할 수 있습니다.</li>
                  <li>현재는 로그인 없이 이용 가능합니다.</li>
                  <li>회원 기능은 추후 추가될 예정입니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">방장 등록</h3>
                <p className="mt-2 text-muted">게시글 작성자의 닉네임과 방 참가 닉네임이 일치하면 자동으로 방장으로 등록됩니다.</p>
              </section>

              <section>
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">방 자동 삭제(방폭)</h3>
                <p className="mt-2 text-muted">활동 중인 방만 유지하기 위해 자동 삭제 기능이 적용됩니다.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>마지막 대화 후 6시간 동안 대화가 없으면 방이 자동 삭제됩니다.</li>
                  <li>새로운 대화가 발생하면 6시간이 다시 연장됩니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">방 이용 안내</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>목적에 맞는 방에만 참여해 주세요.</li>
                  <li>시간, 장소가 변경되면 채팅으로 공유해 주세요.</li>
                  <li>모임이 종료되면 방은 자동으로 정리됩니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">신고 및 이용 제한</h3>
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
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">개인정보 안내</h3>
                <p className="mt-2 text-muted">전화번호, 계좌번호 등 개인정보는 필요한 경우에만 직접 공유해 주세요.</p>
              </section>

              <section>
                <h3 className="text-[17px] font-light tracking-tight text-mingle [font-family:var(--font-plex-kr)]">Beta 서비스</h3>
                <p className="mt-2 text-muted">
                  현재 교류방은 베타 서비스입니다. 더 편리한 이용을 위해 로그인, 알림, 친구 기능 등 다양한 기능이 순차적으로 추가될 예정입니다.
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
