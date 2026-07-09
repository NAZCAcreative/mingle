import { Sparkles } from "lucide-react";
import { Mascot } from "@/components/Mascot";

export function HeroCard() {
  return (
    <section className="mx-4 mt-7 overflow-hidden rounded-card border border-blush bg-gradient-to-br from-blush to-white px-4 py-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Sparkles className="mb-1 h-5 w-5 fill-warning text-warning" />
          <p className="text-[22px] font-light leading-tight tracking-tight text-ink [font-family:var(--font-plex-kr)]">
            카톡 대화를
            <br />
            <span className="whitespace-nowrap text-[20px] text-mingle">즉석 채팅방으로 만들어드려요.</span>
          </p>
          <p className="mt-2 text-[14px] font-light text-neutral-700">대화가 없으면 방은 자동 종료 됩니다.</p>
        </div>
        <Mascot size="md" variant="banner" />
      </div>
    </section>
  );
}
