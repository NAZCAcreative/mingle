import type { Room } from "@/types/room";

export interface AiAnalysis {
  is_actionable: boolean;
  type: "recruitment" | "question" | "ignore";
  category: Room["category"];
  title: string;
  summary: string;
  origin: string | null;
  destination: string | null;
  meeting_time_text: string | null;
  current_people: number;
  max_people: number | null;
  keywords: string[];
  merge_key: string;
  confidence: number;
}
