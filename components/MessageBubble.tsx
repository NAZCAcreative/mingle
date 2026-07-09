import { UserRound } from "lucide-react";
import type { Message } from "@/types/message";

export function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  if (message.nickname === "SYSTEM") {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-light text-muted">{message.content}</span>
      </div>
    );
  }

  const time = new Date(message.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const genderMeta = getGenderMeta(message.gender);
  const GenderIcon = genderMeta.icon;

  return (
    <div className={`flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
      {mine ? <time className="shrink-0 text-[11px] font-light text-muted">{time}</time> : null}
      <div className="min-w-0 max-w-[76%]">
        <p className={`mb-1 flex items-center gap-1 text-xs font-normal text-muted ${mine ? "mr-1 justify-end" : "ml-1 justify-start"}`}>
          <span className={`grid h-5 w-5 place-items-center rounded-full ${genderMeta.badge}`} title={genderMeta.label}>
            <GenderIcon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate">{message.nickname}</span>
        </p>
        <div className={`rounded-[18px] px-4 py-2.5 ${mine ? "rounded-br-[4px] bg-mingle text-white" : "rounded-bl-[4px] bg-white text-ink shadow-card"}`}>
          <p className="whitespace-pre-wrap break-words text-[15px] font-normal leading-relaxed">{message.content}</p>
        </div>
      </div>
      {!mine ? <time className="shrink-0 text-[11px] font-light text-muted">{time}</time> : null}
    </div>
  );
}

function getGenderMeta(gender: Message["gender"]) {
  if (gender === "male") {
    return { label: "남자", icon: UserRound, badge: "bg-blue-50 text-[#3B82F6]" };
  }

  if (gender === "female") {
    return { label: "여자", icon: UserRound, badge: "bg-pink-50 text-[#EC4899]" };
  }

  return { label: "기타", icon: AlienIcon, badge: "bg-violet-50 text-violet-600" };
}

function AlienIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3C7.6 3 5 6.3 5 10.4c0 5.5 4.1 10.1 7 10.1s7-4.6 7-10.1C19 6.3 16.4 3 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 11.2c1.4.2 2.2.9 2.2 1.9-1.7.1-3-.5-3.6-1.7.4-.2.9-.3 1.4-.2Z" fill="currentColor" />
      <path d="M15 11.2c-1.4.2-2.2.9-2.2 1.9 1.7.1 3-.5 3.6-1.7-.4-.2-.9-.3-1.4-.2Z" fill="currentColor" />
      <path d="M10 16.2c1.2.6 2.8.6 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
