"use client";

import { useEffect, useState } from "react";
import { formatCountdown, isCountdownPending, isExpired, isExpiringSoon } from "@/lib/time";

export function useCountdown(expireAt: string) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  void tick;
  return {
    label: formatCountdown(expireAt),
    warning: isExpiringSoon(expireAt),
    expired: isExpired(expireAt),
    pending: isCountdownPending(expireAt)
  };
}
