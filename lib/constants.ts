import type { Category } from "@/types/room";

export const ROOM_TTL_HOURS = 6;

export const ROOM_LIST_WINDOW_HOURS = 12;

export const categoryMeta: Record<Category, { label: string; icon: string; tint: string; badge: string }> = {
  all: {
    label: "전체",
    icon: "Car",
    tint: "bg-blush",
    badge: "border border-blush bg-blush text-mingle"
  },
  taxi: {
    label: "택시팟",
    icon: "Car",
    tint: "bg-blush",
    badge: "border border-blush bg-blush text-mingle"
  },
  travel_swim: {
    label: "여행/수영",
    icon: "Waves",
    tint: "bg-sky-50",
    badge: "border border-sky-100 bg-sky-50 text-sky-600"
  },
  food_drink: {
    label: "밥/술",
    icon: "Beer",
    tint: "bg-orange-50",
    badge: "border border-orange-100 bg-orange-50 text-orange-600"
  },
  cafe: {
    label: "카페",
    icon: "Coffee",
    tint: "bg-purple-50",
    badge: "border border-purple-100 bg-purple-50 text-purple-600"
  },
  hobby_sport: {
    label: "취미/운동",
    icon: "MapPin",
    tint: "bg-rose-50",
    badge: "border border-rose-100 bg-rose-50 text-rose-600"
  },
  life_question: {
    label: "생활질문",
    icon: "House",
    tint: "bg-green-50",
    badge: "border border-green-100 bg-green-50 text-green-700"
  },
  class_question: {
    label: "수업질문",
    icon: "BookOpen",
    tint: "bg-indigo-50",
    badge: "border border-indigo-100 bg-indigo-50 text-indigo-600"
  },
  trade: {
    label: "거래",
    icon: "BadgeDollarSign",
    tint: "bg-amber-50",
    badge: "border border-amber-100 bg-amber-50 text-amber-700"
  },
  event: {
    label: "이벤트",
    icon: "Sparkles",
    tint: "bg-fuchsia-50",
    badge: "border border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600"
  },
  etc: {
    label: "기타",
    icon: "MoreHorizontal",
    tint: "bg-stone-50",
    badge: "border border-stone-200 bg-stone-50 text-stone-600"
  }
};

export const visibleCategories: Category[] = [
  "all",
  "taxi",
  "travel_swim",
  "food_drink",
  "cafe",
  "hobby_sport",
  "life_question",
  "class_question",
  "trade",
  "event",
  "etc"
];
