export interface Message {
  id: string;
  room_id: string;
  nickname: string;
  content: string;
  gender?: "male" | "female" | "other" | null;
  created_at: string;
}
