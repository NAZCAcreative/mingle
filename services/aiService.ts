import { analyzeOpenChatMessage } from "@/lib/ai";

export async function analyzeMessage(content: string) {
  return analyzeOpenChatMessage(content);
}
