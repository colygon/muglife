import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { put, head } from "@vercel/blob";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function GET(request: NextRequest) {
  const mugId = request.nextUrl.searchParams.get("id");

  if (!mugId) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  await ensureSchema();

  // Look up voice info from DB
  const rows = await sql`
    SELECT voice_id, voice_intro_text, name FROM mugs WHERE id = ${Number(mugId)}
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: "Mug not found" }, { status: 404 });
  }

  const { voice_id, voice_intro_text, name } = rows[0] as {
    voice_id: string | null;
    voice_intro_text: string | null;
    name: string;
  };

  if (!voice_id || !voice_intro_text) {
    return NextResponse.json(
      { error: `No voice configured for ${name}` },
      { status: 404 }
    );
  }

  // Check if we already have this voice cached in Blob storage
  const blobKey = `voices/mug-${mugId}-intro.mp3`;
  try {
    const existing = await head(blobKey);
    if (existing) {
      // Redirect to the cached blob URL
      return NextResponse.redirect(existing.url);
    }
  } catch {
    // Blob not found, generate it
  }

  // Generate voice via ElevenLabs
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: voice_intro_text,
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

  // Cache in Vercel Blob for future requests
  try {
    await put(blobKey, new Blob([audioBuffer], { type: "audio/mpeg" }), {
      access: "public",
      contentType: "audio/mpeg",
    });
  } catch (e) {
    console.error("Failed to cache voice in blob:", e);
    // Non-fatal — still serve the audio
  }

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
