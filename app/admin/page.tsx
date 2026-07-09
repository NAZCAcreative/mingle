"use client";

import { Database, MessageSquare, Settings, ShieldCheck, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NicknameModal } from "@/components/NicknameModal";
import { useNickname } from "@/hooks/useNickname";

type AdminOverview = {
  ok: boolean;
  errors?: string[];
  stats: Record<string, number>;
  rooms: Array<Record<string, string | number | null>>;
  closingRooms: Array<Record<string, string | number | null>>;
  expiredRooms: Array<Record<string, string | number | null>>;
  chats: Array<Record<string, string | number | null>>;
  aiLogs: Array<Record<string, string | number | null>>;
  messages: Array<Record<string, string | number | null>>;
  participants: Array<Record<string, string | number | null>>;
  nicknameEvents: Array<Record<string, string | number | null>>;
  nicknameUsers: Array<Record<string, string | number | null>>;
  categories: Array<{ category: string; label: string; rooms: number }>;
  settings: Array<{ key: string; label: string; value: string }>;
};

const fallbackAdmins = ["나스큐"];

const menu = [
  "대시보드",
  "전체 방",
  "폭파 임박 방",
  "삭제된 방",
  "원본 글 목록",
  "AI 분석 결과",
  "생성 실패 로그",
  "방장 관리",
  "채팅 모니터링",
  "사용자/닉네임 관리",
  "카테고리 관리",
  "배너/공지 관리",
  "운영 설정"
];

export default function AdminPage() {
  const { profile, setProfile } = useNickname();
  const [active, setActive] = useState(menu[0]);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminNames, setAdminNames] = useState<string[]>(fallbackAdmins);
  const isAdmin = adminNames.includes(profile.nickname.trim());

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await fetch("/api/admin/admins", { cache: "no-store" });
        const json = await response.json();
        if (Array.isArray(json.admins) && json.admins.length) setAdminNames(json.admins);
      } catch {
        // 네트워크 실패 시 기본 관리자 목록 유지
      }
    };
    void loadAdmins();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/overview", { cache: "no-store" });
        const json = await response.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isAdmin]);

  const closeRoom = useCallback(async (roomId: string) => {
    if (!window.confirm("이 방을 마감할까요?")) return;

    await fetch("/api/admin/rooms/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, nickname: profile.nickname })
    });

    const response = await fetch("/api/admin/overview", { cache: "no-store" });
    setData(await response.json());
  }, [profile.nickname]);

  const section = useMemo(() => buildSection(active, data, closeRoom), [active, closeRoom, data]);

  if (!isAdmin) {
    return (
      <main className="px-4 py-6">
        <section className="rounded-card bg-white p-5 shadow-card">
          <ShieldCheck className="h-8 w-8 text-mingle" />
          <h1 className="mt-3 text-2xl font-semibold text-ink">관리자 페이지</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted">닉네임이 관리자일 때만 접속할 수 있습니다.</p>
          <div className="mt-4">
            <NicknameModal
              initialProfile={profile}
              title="관리자 닉네임을 입력해 주세요"
              submitLabel="접속"
              onSave={setProfile}
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-4">
      <section className="rounded-card bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-mingle">DB 운영 콘솔</p>
            <h1 className="text-2xl font-semibold text-ink">관리자 페이지</h1>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-10 rounded-button bg-blush px-3 text-sm font-medium text-mingle"
          >
            새로고침
          </button>
        </div>

        {data?.errors?.length ? (
          <p className="mt-3 rounded-xl bg-warning/15 px-3 py-2 text-sm font-medium text-ink">{data.errors.join(" · ")}</p>
        ) : null}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat icon={<Database className="h-4 w-4" />} label="전체 방" value={data?.stats.rooms ?? 0} />
        <Stat icon={<Settings className="h-4 w-4" />} label="임박" value={data?.stats.closingRooms ?? 0} />
        <Stat icon={<MessageSquare className="h-4 w-4" />} label="채팅" value={data?.stats.messages ?? 0} />
        <Stat icon={<Users className="h-4 w-4" />} label="닉네임" value={data?.stats.participants ?? 0} />
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {menu.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActive(item)}
              className={`h-10 rounded-button px-3 text-sm font-medium ${active === item ? "bg-mingle text-white" : "bg-white text-ink shadow-card"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-4 rounded-card bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">{active}</h2>
          {loading ? <span className="text-sm font-medium text-muted">불러오는 중</span> : null}
        </div>
        {section}
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-card bg-white p-3 shadow-card">
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function buildSection(active: string, data: AdminOverview | null, onCloseRoom: (roomId: string) => void) {
  if (!data) return <p className="mt-4 text-sm font-medium text-muted">DB 데이터를 불러오고 있습니다.</p>;

  if (active === "대시보드") {
    return (
      <div className="mt-4 space-y-3">
        <MiniTable title="최근 방" rows={data.rooms.slice(0, 6)} fields={["title", "status", "source_message_id"]} />
        <MiniTable title="최근 AI 로그" rows={data.aiLogs.slice(0, 6)} fields={["source_chat_id", "action", "room_id"]} />
      </div>
    );
  }

  if (active === "전체 방") return <MiniTable rows={data.rooms} fields={["title", "status", "source_message_id", "owner_nickname"]} onCloseRoom={onCloseRoom} />;
  if (active === "폭파 임박 방") return <MiniTable rows={data.closingRooms} fields={["title", "expire_at", "status"]} onCloseRoom={onCloseRoom} />;
  if (active === "삭제된 방") return <MiniTable rows={data.expiredRooms} fields={["title", "expire_at", "status"]} />;
  if (active === "원본 글 목록") return <MiniTable rows={data.chats} fields={["id", "sender", "content", "created_at"]} />;
  if (active === "AI 분석 결과") return <MiniTable rows={data.aiLogs} fields={["source_chat_id", "action", "room_id", "created_at"]} />;
  if (active === "생성 실패 로그") return <MiniTable rows={data.aiLogs.filter((log) => log.action === "skipped")} fields={["source_chat_id", "raw_message", "created_at"]} />;
  if (active === "방장 관리") return <MiniTable rows={data.rooms.filter((room) => room.owner_nickname)} fields={["title", "owner_nickname", "source_message_id"]} />;
  if (active === "채팅 모니터링") return <MiniTable rows={data.messages} fields={["nickname", "content", "room_id", "created_at"]} />;
  if (active === "사용자/닉네임 관리") {
    return (
      <div className="mt-4 space-y-3">
        <MiniTable
          title="닉네임 사용자 (기기별)"
          rows={data.nicknameUsers ?? []}
          fields={["nickname", "gender", "device_id", "changes", "last_updated"]}
        />
        <MiniTable
          title="닉네임 수정 이력"
          rows={data.nicknameEvents ?? []}
          fields={["nickname", "gender", "device_id", "created_at"]}
        />
        <MiniTable
          title="방 참여 현황"
          rows={data.participants}
          fields={["nickname", "gender", "device_id", "room_id", "updated_at"]}
        />
      </div>
    );
  }
  if (active === "카테고리 관리") {
    return (
      <div className="mt-4 space-y-3">
        <MiniTable title="카테고리 현황" rows={data.categories} fields={["label", "category", "rooms"]} />
        <div>
          <h3 className="mb-1 text-sm font-semibold text-ink">표시명 수정</h3>
          <SettingsEditor
            settings={data.categories.map((item) => ({
              key: `category_label_${item.category}`,
              label: `${item.category} 표시명`,
              value: item.label
            }))}
          />
        </div>
      </div>
    );
  }
  if (active === "운영 설정") return <SettingsEditor settings={data.settings} />;

  return <p className="mt-4 text-sm font-medium text-muted">배너/공지 DB 테이블을 연결하면 이 영역에서 관리합니다.</p>;
}

function SettingsEditor({ settings }: { settings: Array<{ key: string; label: string; value: string }> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const save = async (key: string, fallback: string) => {
    const value = values[key] ?? fallback;
    setSavingKey(key);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        window.alert(`저장 실패: ${json.error ?? response.status}\napp_settings 테이블이 있는지 확인해 주세요.`);
        return;
      }
      setSavedKey(key);
      window.setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 1500);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {settings.map((setting) => (
        <div key={setting.key} className="rounded-xl border border-blush p-3">
          <p className="text-sm font-medium text-muted">
            {setting.label} <span className="text-xs text-muted/70">({setting.key})</span>
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={values[setting.key] ?? setting.value}
              onChange={(event) => setValues((prev) => ({ ...prev, [setting.key]: event.target.value }))}
              className="h-10 min-w-0 flex-1 rounded-button border border-blush bg-cream px-3 text-sm outline-none focus:border-mingle"
              aria-label={`${setting.label} 값`}
            />
            <button
              type="button"
              onClick={() => void save(setting.key, setting.value)}
              disabled={savingKey === setting.key}
              className="h-10 shrink-0 rounded-button bg-mingle px-3 text-sm font-medium text-white disabled:bg-neutral-300"
            >
              {savingKey === setting.key ? "저장중" : savedKey === setting.key ? "저장됨" : "저장"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniTable({
  title,
  rows,
  fields,
  onCloseRoom
}: {
  title?: string;
  rows: Array<Record<string, unknown>>;
  fields: string[];
  onCloseRoom?: (roomId: string) => void;
}) {
  return (
    <div className="mt-4">
      {title ? <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3> : null}
      {rows.length === 0 ? (
        <p className="rounded-xl bg-cream px-3 py-4 text-sm font-medium text-muted">표시할 데이터가 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-card border border-blush">
          {rows.slice(0, 50).map((row, index) => (
            <div key={index} className="border-b border-blush p-3 last:border-b-0">
              {fields.map((field) => (
                <p key={field} className="grid grid-cols-[136px_minmax(0,1fr)] gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-muted" title={field}>{field}</span>
                  <span className="min-w-0 truncate text-ink">{String(row[field] ?? "-")}</span>
                </p>
              ))}
              {onCloseRoom && row.id && row.status !== "expired" ? (
                <button
                  type="button"
                  onClick={() => onCloseRoom(String(row.id))}
                  className="mt-3 h-9 rounded-button bg-mingle px-3 text-sm font-medium text-white"
                >
                  방 마감
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
