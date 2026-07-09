import { normalizePlace } from "@/lib/parser";
import type { AiAnalysis } from "@/types/ai";
import type { Room } from "@/types/room";

export function findMergeCandidate(rooms: Room[], analysis: AiAnalysis) {
  return rooms.find((room) => {
    if (room.category !== analysis.category) return false;
    if (room.merge_key && room.merge_key === analysis.merge_key) return true;
    const roomTarget = normalizePlace(room.destination || room.origin || room.title);
    const nextTarget = normalizePlace(analysis.destination || analysis.origin || analysis.title);
    if (!roomTarget || !nextTarget) return false;
    return roomTarget.includes(nextTarget) || nextTarget.includes(roomTarget) || keywordOverlap(room.keywords, analysis.keywords) >= 0.5;
  });
}

function keywordOverlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const set = new Set(a.map(normalizePlace));
  const hits = b.map(normalizePlace).filter((item) => set.has(item)).length;
  return hits / Math.max(a.length, b.length);
}
