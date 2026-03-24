import OpenAI from "openai";
import type { MugProfile } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatWithMug(
  mug: MugProfile,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const recentFloors = mug.recent_scans
    .slice(0, 5)
    .map((s) => `Floor ${s.floor} (${s.scanner_name})`)
    .join(", ");

  const systemPrompt = `${mug.personality_prompt}

CURRENT CONTEXT (use this to stay in character):
- You are currently on Floor ${mug.current_floor ?? "unknown"}.
- Your home is Floor ${mug.home_floor}.
- You have been away from home for ${mug.days_away} days.
- You have been scanned ${mug.total_scans} times total.
- Recent locations: ${recentFloors || "none yet"}.
- You have ${mug.selfies.length} selfies taken with you.

Respond in 2-3 sentences max. Stay in character as a coffee mug.`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    messages,
  });

  return response.choices[0]?.message?.content || "...";
}
