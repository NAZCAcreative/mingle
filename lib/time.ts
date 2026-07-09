import { ROOM_TTL_HOURS } from "@/lib/constants";

export function addRoomTtl(date = new Date()) {
  return new Date(date.getTime() + ROOM_TTL_HOURS * 60 * 60 * 1000);
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
