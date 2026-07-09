import { Sparkles } from "lucide-react";
import { Mascot } from "@/components/Mascot";

export function HeroCard() {
  return (
    <section className="mx-4 mt-7 overflow-hidden rounded-card border border-blush bg-gradient-to-br from-blush to-white px-4 py-3 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Sparkles className="mb-1 h-5 w-5 fill-warning text-warning" />
          <p className="text-[20px] font-semibold leading-tight text-ink">
            카톡 대화를
            <br />
            <span className="text-mingle">즉석 채팅방으로 만들어드려요.</span>
          </p>
          <p className="mt-2 text-[13px] font-semibold text-neutral-700">지금 바로 원하는 방에 참여해보세요.</p>
        </div>
        <Mascot size="md" variant="banner" />
      </div>
    </section>
  );
}
