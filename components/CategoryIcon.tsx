import { BadgeDollarSign, Beer, BookOpen, Car, Coffee, Home, LayoutGrid, MapPin, MoreHorizontal, Sparkles, Waves } from "lucide-react";
import type { Category } from "@/types/room";

const icons = {
  all: LayoutGrid,
  taxi: Car,
  travel_swim: Waves,
  food_drink: Beer,
  cafe: Coffee,
  hobby_sport: MapPin,
  life_question: Home,
  class_question: BookOpen,
  trade: BadgeDollarSign,
  event: Sparkles,
  etc: MoreHorizontal
};

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = icons[category] ?? MoreHorizontal;
  return <Icon className={className} strokeWidth={1.4} />;
}
