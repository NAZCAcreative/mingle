import { ROOM_TTL_HOURS } from "@/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const FUTURE_DAY_COUNTDOWN_HOURS = 12;

export function addRoomTtl(date = new Date()) {
  return new Date(date.getTime() + ROOM_TTL_HOURS * 60 * 60 * 1000);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseKoreanMeetingDate(value: string | null | undefined, base = new Date()): Date | null {
  if (!value) return null;

  const md = value.match(/(\d{1,2})\s*[\/.]\s*(\d{1,2})/) ?? value.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (md) {
    const month = Number(md[1]);
    const day = Number(md[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let date = new Date(base.getFullYear(), month - 1, day);
      // 한 달 이상 지난 날짜면 내년 날짜로 해석
      if (date.getTime() < startOfDay(base).getTime() - 30 * DAY_MS) {
        date = new Date(base.getFullYear() + 1, month - 1, day);
      }
      return date;
    }
  }

  if (value.includes("모레")) return new Date(startOfDay(base).getTime() + 2 * DAY_MS);
  if (value.includes("내일")) return new Date(startOfDay(base).getTime() + DAY_MS);
  if (value.includes("오늘")) return startOfDay(base);
  return null;
}

const KOREAN_HOUR_WORDS: Array<[string, number]> = [
  ["열두", 12],
  ["열한", 11],
  ["열", 10],
  ["아홉", 9],
  ["여덟", 8],
  ["일곱", 7],
  ["여섯", 6],
  ["다섯", 5],
  ["네", 4],
  ["세", 3],
  ["두", 2],
  ["한", 1]
];

type MeetingClock = { hour: number; minute: number; meridiem: "am" | "pm" | null };

export function parseKoreanMeetingClock(value: string | null | undefined): MeetingClock | null {
  if (!value) return null;

  const hhmm = value.match(/(오전|오후)?\s*(\d{1,2}):(\d{2})/);
  if (hhmm) {
    const hour = Number(hhmm[2]);
    const minute = Number(hhmm[3]);
    if (hour <= 24 && minute <= 59) {
      const meridiem = hhmm[1] === "오전" ? "am" : hhmm[1] === "오후" ? "pm" : hour > 12 ? "pm" : null;
      return { hour: hour > 12 ? hour - 12 : hour, minute, meridiem };
    }
  }

  const numeric = value.match(/(오전|오후|저녁|밤|새벽|아침)?\s*(\d{1,2})\s*시\s*(반)?/);
  if (numeric) {
    const hour = Number(numeric[2]);
    if (hour >= 1 && hour <= 24) {
      const marker = numeric[1] ?? "";
      const meridiem =
        marker === "오전" || marker === "새벽" || marker === "아침"
          ? "am"
          : marker === "오후" || marker === "저녁" || marker === "밤" || hour > 12
            ? "pm"
            : null;
      return { hour: hour > 12 ? hour - 12 : hour, minute: numeric[3] ? 30 : 0, meridiem };
    }
  }

  for (const [word, hour] of KOREAN_HOUR_WORDS) {
    const korean = value.match(new RegExp(`(오전|오후|저녁|밤|새벽|아침)?\\s*${word}시\\s*(반)?`));
    if (korean) {
      const marker = korean[1] ?? "";
      const meridiem =
        marker === "오전" || marker === "새벽" || marker === "아침"
          ? "am"
          : marker === "오후" || marker === "저녁" || marker === "밤"
            ? "pm"
            : null;
      return { hour, minute: korean[2] ? 30 : 0, meridiem };
    }
  }

  return null;
}

const MEETING_GRACE_MS = 2 * 60 * 60 * 1000;

function meetingClockCandidates(day: Date, clock: MeetingClock): number[] {
  const base = startOfDay(day).getTime() + clock.minute * 60 * 1000;
  const h = clock.hour % 12;
  if (clock.meridiem === "am") return [base + h * 3600_000];
  if (clock.meridiem === "pm") return [base + (h + 12) * 3600_000];
  return [base + h * 3600_000, base + (h + 12) * 3600_000];
}

// 모임 날짜가 오늘 이후면 해당일 자정부터 12시간 카운트다운, 그 외에는 기본 TTL.
// 모임 시각을 읽을 수 있으면 모임 시각 + 2시간으로 만료를 앞당긴다(연장은 하지 않음).
export function computeRoomExpireAt(baseTime: Date, meetingTimeText?: string | null) {
  const meetingDay = parseKoreanMeetingDate(meetingTimeText, baseTime);
  const futureDay = Boolean(meetingDay && startOfDay(meetingDay).getTime() > startOfDay(baseTime).getTime());

  let expire = futureDay
    ? new Date(startOfDay(meetingDay as Date).getTime() + FUTURE_DAY_COUNTDOWN_HOURS * 60 * 60 * 1000)
    : addRoomTtl(baseTime);

  const clock = parseKoreanMeetingClock(meetingTimeText);
  if (clock) {
    const days = futureDay
      ? [meetingDay as Date]
      : [startOfDay(baseTime), new Date(startOfDay(baseTime).getTime() + DAY_MS)];
    const windowStart = baseTime.getTime() - 30 * 60 * 1000;
    const windowEnd = futureDay ? Number.POSITIVE_INFINITY : baseTime.getTime() + 14 * 60 * 60 * 1000;
    const meeting = days
      .flatMap((day) => meetingClockCandidates(day, clock))
      .filter((time) => time >= windowStart && time <= windowEnd)
      .sort((a, b) => a - b)[0];

    if (meeting) {
      // 모임 시각을 알면 모임 + 2시간에 방을 정리한다 (앞당김/연장 모두)
      expire = new Date(meeting + MEETING_GRACE_MS);
    }
  }

  return expire;
}

// 만료일이 미래 날짜면 아직 카운트다운 시작 전
export function isCountdownPending(expireAt: string | Date) {
  const target = typeof expireAt === "string" ? new Date(expireAt) : expireAt;
  return startOfDay(target).getTime() > startOfDay(new Date()).getTime();
}

export function formatCountdown(expireAt: string | Date) {
  const target = typeof expireAt === "string" ? new Date(expireAt) : expireAt;
  const diff = Math.max(0, target.getTime() - Date.now());
  if (diff <= 0) return "종료";

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isExpiringSoon(expireAt: string | Date) {
  const target = typeof expireAt === "string" ? new Date(expireAt) : expireAt;
  const diff = target.getTime() - Date.now();
  return diff > 0 && diff < 10 * 60 * 1000;
}

export function isExpired(expireAt: string | Date) {
  const target = typeof expireAt === "string" ? new Date(expireAt) : expireAt;
  return target.getTime() <= Date.now();
}

export function formatChatAt(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const sameDate =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  if (sameDate) return `생성 ${time}`;

  const day = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric"
  }).format(date);
  return `생성 ${day} ${time}`;
}

export function parseKoreanSentAtText(value?: string) {
  if (!value) return null;

  const match = value.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?(오전|오후)\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const [, year, month, day, meridiem, hourText, minuteText] = match;
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (meridiem === "오전" && hour === 12) hour = 0;
  if (meridiem === "오후" && hour < 12) hour += 12;

  const kstTime = Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 9, minute);
  return new Date(kstTime).toISOString();
}
