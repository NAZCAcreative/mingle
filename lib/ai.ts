import { analyzeByRules } from "@/lib/parser";
import type { AiAnalysis } from "@/types/ai";

export async function analyzeOpenChatMessage(content: string): Promise<AiAnalysis> {
  const fallback = analyzeByRules(content);
  if (!process.env.OPENAI_API_KEY) return fallback;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Open chat messages are in Korean. Classify each message as recruitment, question, or ignore, and return only JSON fields compatible with this schema: is_actionable, type, category, title, summary, origin, destination, meeting_time_text, current_people, max_people, keywords, merge_key, confidence. category must be one of taxi, travel_swim, food_drink, cafe, hobby_sport, life_question, class_question, trade, event, etc."
        },
        {
          role: "user",
          content
        }
      ]
    })
  });

  if (!response.ok) return fallback;

  try {
    const json = await response.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}
