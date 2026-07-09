import type { AiAnalysis } from "@/types/ai";

const categoryRules: Array<[AiAnalysis["category"], RegExp]> = [
  ["class_question", /(시험|수업|강의|학점|과제|출석|중간고사|계절학기)/i],
  ["food_drink", /(밥|술|간술|공차|맛집|치킨|맥주|소주|먹|마실|저녁|점심|아침)/i],
  ["cafe", /(카페|예카|목장카페|커피|디저트)/i],
  ["taxi", /(택시|같이\s*타|타실\s*분|카풀|출발)/i],
  ["travel_swim", /(해수욕장|수영|바다|함덕|김녕|애월|동문시장|목장|제동|사진|여행|다녀오|유람선|아쿠아플라넷|아쿠아플레넷|에코랜드|성산|한담공원|해변|공항)/i],
  ["hobby_sport", /(보드게임|탁구|농구|러닝|운동|산책|사진)/i],
  ["trade", /(공구|삽니다|팝니다|양도|가격|나눔)/i],
  ["event", /(파티|행사|프로모션|이벤트|모임)/i],
  ["life_question", /(혹시|어떻게|궁금|아시는\s*분|되나요|괜찮나요|사용법|기숙사|생활)/i]
];

const recruitmentPattern = /(구해|구함|구합니다|모집|같이|가실\s*분|하실\s*분|드실\s*분|타실\s*분|계신가요|있나요)/i;
const questionPattern = /(\?|혹시|궁금|아시는\s*분|되나요|괜찮나요|어떻게)/i;

export function analyzeByRules(content: string): AiAnalysis {
  const normalized = content.replace(/\s+/g, " ").trim();
  const category = categoryRules.find(([, regex]) => regex.test(normalized))?.[0] ?? "etc";
  const isRecruitment = recruitmentPattern.test(normalized);
  const isQuestion = questionPattern.test(normalized);
  const actionable = category !== "etc" && (isRecruitment || isQuestion);
  const people = extractPeople(normalized);
  const route = extractRoute(normalized);
  const keywords = extractKeywords(normalized);
  const type = !actionable ? "ignore" : isQuestion && !isRecruitment ? "question" : "recruitment";
  const title = makeTitle(normalized, category, route.origin, route.destination, type);

  return {
    is_actionable: actionable,
    type,
    category,
    title,
    summary: normalized.slice(0, 120),
    origin: route.origin,
    destination: route.destination,
    meeting_time_text: extractTime(normalized),
    current_people: people.current,
    max_people: people.max,
    keywords,
    merge_key: `${category}:${normalizePlace(route.origin)}:${normalizePlace(route.destination || keywords[0] || title)}`,
    confidence: actionable ? 0.78 : 0.35
  };
}

function extractPeople(content: string) {
  const slash = content.match(/(\d+)\s*\/\s*(\d+)/);
  if (slash) return { current: Number(slash[1]), max: Number(slash[2]) };

  const maxMatch = content.match(/(\d+)\s*(명|분|명까지|분까지)/);
  const currentMatch = content.match(/저희가\s*(\d+)\s*명|저희는\s*(\d+)\s*명|(\d+)\s*명이라/);
  const max = maxMatch ? Number(maxMatch[1]) : null;
  const current = Number(currentMatch?.[1] ?? currentMatch?.[2] ?? currentMatch?.[3] ?? 1);
  return { current, max };
}

function extractRoute(content: string) {
  const route =
    content.match(/(.{1,24}?)(?:에서)\s*(.{1,24}?)(?:까지|으로|로)\b/) ??
    content.match(/(.{1,24}?)(?:->|→)\s*(.{1,24}?)(?:\s|$)/);

  if (!route) return { origin: null, destination: null };
  return {
    origin: cleanPlace(route[1]),
    destination: cleanPlace(route[2])
  };
}

function cleanPlace(value: string | undefined) {
  if (!value) return null;
  const cleaned = value
    .replace(/^(오늘|내일|저희|혹시|같이|오후|오전|쯤|에)\s*/g, "")
    .replace(/(택시|타고|같이|가실|분|구해요|구합니다).*$/g, "")
    .trim();
  return cleaned || null;
}

function extractTime(content: string) {
  return (
    content.match(/(?:오늘|내일)?\s*(?:오전|오후|저녁)?\s*\d{1,2}\s*시\s*(?:\d{1,2}\s*분|반|쯤)?/)?.[0]?.trim() ??
    content.match(/\d{1,2}\s*:\s*\d{2}/)?.[0]?.trim() ??
    null
  );
}

function extractKeywords(content: string) {
  const stopwords = new Set(["저희", "같이", "혹시", "내일", "오늘", "분", "명", "구해요", "구합니다", "있나요", "계신가요"]);
  return Array.from(
    new Set(
      content
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length >= 2 && !stopwords.has(word))
    )
  ).slice(0, 10);
}

function makeTitle(
  content: string,
  category: AiAnalysis["category"],
  origin: string | null,
  destination: string | null,
  type: AiAnalysis["type"]
) {
  if (category === "taxi" && origin && destination) return `${origin} -> ${destination} 택시팟`;
  if (type === "question") return content.slice(0, 32);
  return content.slice(0, 34);
}

export function normalizePlace(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/제주대|제주대학교|긱사|기숙사/g, "기숙사")
    .replace(/\s+/g, "")
    .toLowerCase();
}
