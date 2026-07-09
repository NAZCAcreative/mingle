export type Category =
  | "all"
  | "taxi"
  | "travel_swim"
  | "food_drink"
  | "cafe"
  | "hobby_sport"
  | "life_question"
  | "class_question"
  | "trade"
  | "event"
  | "etc";

export type RoomStatus = "open" | "answering" | "closed" | "expired";

export interface Room {
  id: string;
  title: string;
  category: Exclude<Category, "all">;
  summary: string;
  origin: string | null;
  destination: string | null;
  meeting_time_text: string | null;
  current_people: number;
  max_people: number | null;
  status: RoomStatus;
  merge_key: string;
  keywords: string[];
  source_message_id: string | null;
  kakao_sender?: string | null;
  owner_nickname?: string | null;
  participant_count?: number;
  gender_counts?: {
    male: number;
    female: number;
    other: number;
  };
  source_chat_at?: string | null;
  last_message_at: string;
  expire_at: string;
  created_at: string;
  updated_at: string;
}
