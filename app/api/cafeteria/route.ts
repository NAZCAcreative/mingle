import { NextResponse } from "next/server";

const cafeteriaPages = [
  { name: "백두관", url: "https://cms.jejunu.ac.kr/camp/stud/foodmenu/firstfixmenu.htm" },
  { name: "사라캠퍼스", url: "https://cms.jejunu.ac.kr/camp/stud/foodmenu/secondfixmenu.htm" },
  { name: "학생생활관 6호관", url: "https://cms.jejunu.ac.kr/camp/stud/foodmenu/fixfirst.htm" },
  { name: "교수회관", url: "https://cms.jejunu.ac.kr/camp/stud/foodmenu/fifthmenu.htm" },
  { name: "학생생활관 1호관", url: "https://cms.jejunu.ac.kr/camp/stud/foodmenu/fixmenu.htm" }
];

type Meal = {
  label: string;
  items: string[];
};

export type CafeteriaMenu = {
  name: string;
  date: string;
  meals: Meal[];
  sourceUrl: string;
  error?: string;
};

export async function GET() {
  const today = todayKst();
  const menus = await Promise.all(cafeteriaPages.map((page) => loadCafeteria(page, today)));

  return NextResponse.json({
    date: today.label,
    menus,
    source: "제주대학교 금주의메뉴"
  });
}

async function loadCafeteria(page: { name: string; url: string }, today: { key: string; label: string }): Promise<CafeteriaMenu> {
  try {
    const response = await fetch(page.url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; mingle-cafeteria/1.0)"
      }
    });

    if (!response.ok) {
      return { name: page.name, date: today.label, meals: [], sourceUrl: page.url, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    return {
      name: page.name,
      date: today.label,
      meals: parseTodayMeals(html, today.key),
      sourceUrl: page.url
    };
  } catch (error) {
    return {
      name: page.name,
      date: today.label,
      meals: [],
      sourceUrl: page.url,
      error: error instanceof Error ? error.message : "fetch_failed"
    };
  }
}

function parseTodayMeals(html: string, todayKey: string): Meal[] {
  const table = html.match(/<table[^>]*>[\s\S]*?<\/table>/i)?.[0];
  if (!table) return [];

  const headerRow = table.match(/<thead[^>]*>[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/i)?.[1] ?? "";
  const headers = Array.from(headerRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi))
    .map((match) => cleanText(match[1]))
    .filter(Boolean)
    .slice(1);

  const rows = Array.from(table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  for (const row of rows) {
    const dateText = cleanText(row.match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? "");
    if (!dateText.includes(todayKey)) continue;

    return Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((match, index) => ({
      label: headers[index] || `메뉴 ${index + 1}`,
      items: splitMenuItems(match[1])
    }));
  }

  return [];
}

function splitMenuItems(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/br>/gi, "\n")
    .split("\n")
    .map(cleanText)
    .filter(Boolean);
}

function cleanText(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function todayKst() {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { key: `${month}/${day}`, label: `${month}/${day}` };
}
