import type { Message } from "@/types/message";

export function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  const time = new Date(message.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
      {mine ? <time className="shrink-0 text-[11px] font-light text-muted">{time}</time> : null}
      <div className="min-w-0 max-w-[76%]">
        <p className={`mb-1 text-xs font-normal text-muted ${mine ? "mr-1 text-right" : "ml-1"}`}>{message.nickname}</p>
        <div className={`rounded-[18px] px-4 py-2.5 ${mine ? "rounded-br-[4px] bg-mingle text-white" : "rounded-bl-[4px] bg-white text-ink shadow-card"}`}>
          <p className="whitespace-pre-wrap break-words text-[15px] font-normal leading-relaxed">{message.content}</p>
        </div>
      </div>
      {!mine ? <time className="shrink-0 text-[11px] font-light text-muted">{time}</time> : null}
    </div>
  );
}
