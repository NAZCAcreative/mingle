# Mingle

Mingle은 로그인 없이 즉석 채팅방을 보고, 닉네임만 입력해 바로 대화하는 모바일 우선 웹앱입니다. 외부 오픈채팅 데이터를 가져와 AI가 모집글과 질문글을 분석하고, 유사한 목적의 방은 자동 병합합니다.

## 설치 및 실행

```bash
npm install
npm run dev
```

Supabase 환경변수가 없으면 샘플 방 데이터로 실행됩니다.

## 환경변수

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
CHAT_SOURCE_URL=https://dm.kggstudio.com/chats
```

`OPENAI_API_KEY`가 없으면 로컬 규칙 기반 분석기로 동작합니다.

## Supabase SQL

```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  summary text not null,
  origin text,
  destination text,
  meeting_time_text text,
  current_people int default 0,
  max_people int,
  status text default 'open',
  merge_key text,
  keywords text[],
  source_message_id text,
  kakao_sender text,
  owner_nickname text,
  last_message_at timestamptz not null default now(),
  expire_at timestamptz not null default now() + interval '6 hours',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  nickname text not null,
  content text not null,
  created_at timestamptz default now()
);

create table room_participants (
  room_id uuid references rooms(id) on delete cascade,
  nickname text not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  joined_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (room_id, nickname)
);

create table ingested_chats (
  id bigint primary key,
  raw jsonb not null,
  content text not null,
  sender text,
  created_at timestamptz,
  processed_at timestamptz default now()
);

create table ai_logs (
  id uuid primary key default gen_random_uuid(),
  source_chat_id bigint,
  raw_message text not null,
  analysis jsonb not null,
  action text not null,
  room_id uuid,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table room_participants;
```

## API

- `GET /api/rooms`: 만료되지 않은 active 방 목록 반환
- `GET /api/rooms?roomId=...`: 방 상세 반환
- `POST /api/messages`: 메시지 저장, `last_message_at`과 `expire_at = now() + 6 hours` 갱신
- `POST /api/ingest`: `CHAT_SOURCE_URL?after_id={lastId}`에서 새 채팅 수집 후 AI 분석 및 방 생성/병합
- `POST /api/rooms/expire`: 만료 방을 `expired` 처리
- `POST /api/ai/analyze`: 단일 메시지 분석

## AI 분석 흐름

1. `ingested_chats`에서 마지막 id를 조회합니다.
2. 외부 채팅 API에서 새 메시지만 가져옵니다.
3. OpenAI API가 있으면 JSON 분석을 요청하고, 없으면 규칙 기반 분석기를 사용합니다.
4. `recruitment` 또는 `question`이면 `merge_key`, 카테고리, 장소, 키워드로 기존 방과 병합 후보를 찾습니다.
5. 의미가 같은 방이면 새로 만들지 않고 기존 방의 인원, 키워드, 방폭 시간을 갱신합니다.

## 방폭 정책

- 방 생성 시 `expire_at = now() + interval '6 hours'`
- 메시지 전송 시 `last_message_at = now()`, `expire_at = now() + interval '6 hours'`
- 카드와 상세 화면은 실시간 카운트다운을 표시합니다.
- 10분 미만이면 경고색으로 표시합니다.
- `POST /api/rooms/expire`를 Vercel Cron 등으로 주기 실행하면 만료 방을 정리할 수 있습니다.

## 배포

Vercel에 프로젝트를 연결하고 환경변수를 등록한 뒤 배포합니다. Supabase Realtime을 사용하려면 SQL의 publication 설정을 적용하세요.
