"use client";

import { useCountdown } from "@/hooks/useCountdown";

export function CountdownBadge({ expireAt, wide = false }: { expireAt: string; wide?: boolean }) {
  const { label, warning, expired } = useCountdown(expireAt);

  const sizeClass = wide ? "h-[64px] w-full px-4 text-[17px]" : "h-[56px] min-w-[136px] shrink-0 px-3 text-[14px]";

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-button font-semibold shadow-card ${sizeClass} ${
        expired
          ? "bg-neutral-100 text-neutral-400"
          : warning
            ? "animate-pulse bg-red-50 text-red-600 ring-2 ring-red-100"
            : "animate-pulse bg-orange-50 text-orange-600 ring-1 ring-orange-100"
      }`}
    >
      <span>{expired ? "폭파됨" : "폭파까지"}</span>
      <span className={`${wide ? "text-[24px]" : "text-[18px]"} tracking-normal`}>{label}</span>
    </div>
  );
}
