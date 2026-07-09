import type { Category } from "@/types/room";

export const ROOM_TTL_HOURS = 6;

export const ROOM_LIST_WINDOW_HOURS = 12;

export const categoryMeta: Record<Category, { label: string; icon: string; tint: string; badge: string; iconColor: string }> = {
  all: {
    label: "전체",
    icon: "LayoutGrid",
    tint: "bg-blush",
    badge: "border border-mingle bg-mingle text-white",
    iconColor: "text-mingle"
  },
  taxi: {
    label: "택시팟",
    icon: "Car",
    tint: "bg-blush",
    badge: "border border-mingle bg-mingle text-white",
    iconColor: "text-mingle"
  },
  travel_swim: {
    label: "여행/수영",
    icon: "Waves",
    tint: "bg-sky-50",
    badge: "border border-sky-500 bg-sky-500 text-white",
    iconColor: "text-sky-500"
  },
  food_drink: {
    label: "밥/술",
    icon: "Beer",
    tint: "bg-blue-50",
    badge: "border border-blue-500 bg-blue-500 text-white",
    iconColor: "text-blue-500"
  },
  cafe: {
    label: "카페",
    icon: "Coffee",
    tint: "bg-indigo-50",
    badge: "border border-indigo-500 bg-indigo-500 text-white",
    iconColor: "text-indigo-500"
  },
  hobby_sport: {
    label: "취미/운동",
    icon: "MapPin",
    tint: "bg-violet-50",
    badge: "border border-violet-500 bg-violet-500 text-white",
    iconColor: "text-violet-500"
  },
  life_question: {
    label: "생활질문",
    icon: "House",
    tint: "bg-cyan-50",
    badge: "border border-cyan-600 bg-cyan-600 text-white",
    iconColor: "text-cyan-600"
  },
  class_question: {
    label: "수업질문",
    icon: "BookOpen",
    tint: "bg-indigo-100",
    badge: "border border-indigo-700 bg-indigo-700 text-white",
    iconColor: "text-indigo-700"
  },
  trade: {
    label: "거래",
    icon: "BadgeDollarSign",
    tint: "bg-blue-100",
    badge: "border border-blue-800 bg-blue-800 text-white",
    iconColor: "text-blue-800"
  },
  event: {
    label: "이벤트",
    icon: "Sparkles",
    tint: "bg-violet-100",
    badge: "border border-violet-700 bg-violet-700 text-white",
    iconColor: "text-violet-700"
  },
  etc: {
    label: "기타",
    icon: "MoreHorizontal",
    tint: "bg-slate-100",
    badge: "border border-slate-500 bg-slate-500 text-white",
    iconColor: "text-slate-500"
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
