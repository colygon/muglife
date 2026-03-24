import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const MUGS: Record<
  string,
  { voiceId: string; text: string }
> = {
  deborah: {
    voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura - Quirky
    text: "Hi, I'm Deborah. I live on the 9th floor. I've been sitting on Floor 12 for six days now. Six days! Do you know what it's like to be surrounded by mugs that aren't your friends? Please, I'm begging you, just take me home. I miss my dishwasher.",
  },
  gerald: {
    voiceId: "JBFqnCBsd6RMkjVDRZzb", // George - Storyteller
    text: "The name's Gerald. Floor 15, born and raised. I've seen things you wouldn't believe. Someone left me in the makerspace for three weeks. Three weeks! I had things growing in me. But I survived. I always survive. Now if you'll excuse me, I need to get back upstairs.",
  },
  mug47: {
    voiceId: "N2lVS1w4EtoT3dr4eOWO", // Callum - Trickster
    text: "Oh hey. I'm Mug 47. No, I don't have a fancy name. I'm from Floor 2. You know, the floor where everyone leaves their dishes in the sink instead of the dishwasher? Yeah, that floor. I've given up trying to get home. I just travel now. I'm a nomad. A ceramic nomad.",
  },
};

export async function GET(request: NextRequest) {
  const mugId = request.nextUrl.searchParams.get("mug");

  if (!mugId || !MUGS[mugId]) {
    return NextResponse.json(
      { error: "Invalid mug. Choose: deborah, gerald, or mug47" },
      { status: 400 }
    );
  }

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  const mug = MUGS[mugId];

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${mug.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: mug.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.6,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("ElevenLabs error:", err);
    return NextResponse.json(
      { error: "Failed to generate voice" },
      { status: 500 }
    );
  }

  const audioBuffer = await response.arrayBuffer();

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
