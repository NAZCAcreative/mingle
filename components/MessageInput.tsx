"use client";

import { Send } from "lucide-react";
import { useState } from "react";

export function MessageInput({ disabled, onSend }: { disabled: boolean; onSend: (content: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <form
      className="flex gap-2 border-t border-blush bg-cream p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!value.trim() || disabled || sending) return;
        setSending(true);
        await onSend(value.trim());
        setValue("");
        setSending(false);
      }}
    >
      <input disabled={disabled} value={value} onChange={(event) => setValue(event.target.value)} placeholder={disabled ? "닉네임 입력 후 대화할 수 있어요" : "메시지를 입력하세요"} className="h-[52px] min-w-0 flex-1 rounded-button border border-blush bg-white px-4 text-[16px] font-medium outline-none focus:border-mingle disabled:bg-neutral-100" />
      <button disabled={disabled || sending} className="grid h-[52px] w-[52px] place-items-center rounded-button bg-mingle text-white disabled:bg-neutral-300">
        <Send className="h-6 w-6" />
      </button>
    </form>
  );
}
