import { NextRequest, NextResponse } from "next/server";
import { getMugProfile } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mugId = parseInt(params.id);
  if (isNaN(mugId)) {
    return NextResponse.json({ error: "Invalid mug ID" }, { status: 400 });
  }

  const profile = await getMugProfile(mugId);
  if (!profile) {
    return NextResponse.json({ error: "Mug not found" }, { status: 404 });
  }

  const recentFloors = profile.recent_scans
    .slice(0, 5)
    .map((s) => `Floor ${s.floor} (${s.scanner_name})`)
    .join(", ");

  const systemPrompt = `${profile.personality_prompt}

CURRENT CONTEXT (use this to stay in character):
- You are currently on Floor ${profile.current_floor ?? "unknown"}.
- Your home is Floor ${profile.home_floor}.
- You have been away from home for ${profile.days_away} days.
- You have been scanned ${profile.total_scans} times total.
- Recent locations: ${recentFloors || "none yet"}.
- You have ${profile.selfies.length} selfies taken with you.

Respond in 2-3 sentences max. Stay in character as a coffee mug.`;

  return NextResponse.json({
    systemPrompt,
    voiceId: profile.voice_id,
    firstMessage: profile.voice_intro_text || `Hey! I'm ${profile.name}. What's up?`,
    mugName: profile.name,
  });
}
