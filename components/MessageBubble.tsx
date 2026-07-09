import type { Message } from "@/types/message";

export function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-[20px] px-4 py-3 shadow-card ${mine ? "rounded-br-md bg-mingle text-white" : "rounded-bl-md bg-white text-ink"}`}>
        {!mine && <p className="mb-1 text-xs font-semibold text-mingle">{message.nickname}</p>}
        <p className="whitespace-pre-wrap text-[15px] font-semibold leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
