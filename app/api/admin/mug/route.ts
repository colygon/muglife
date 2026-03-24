import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createMug } from "@/lib/queries";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, home_floor } = body;

    if (!name || !home_floor) {
      return NextResponse.json(
        { error: "Name and home floor are required" },
        { status: 400 }
      );
    }

    // Generate personality prompt from description
    const personalityPrompt = `You are ${name}, a coffee mug in Frontier Tower. ${description || "You're a friendly mug with a warm personality."}

Keep responses to 2-3 sentences max. Stay in character as a coffee mug.`;

    // Generate avatar with DALL-E
    let imageUrl: string | null = null;
    try {
      const imageRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Kawaii ceramic coffee mug character illustration. ${description || "A friendly mug with a warm personality."}. The mug has a unique shape and personality. Two wide-set dot eyes in lower third of body, small mouth, pink blush ovals on cheeks. Thin black noodle arms and legs (1930s rubber-hose animation style). Satin-matte glaze finish. Warm earthy background. Storybook illustration style, Adventure Time meets Animal Crossing aesthetic. Single character centered.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const dalleUrl = imageRes.data[0]?.url;
      if (dalleUrl) {
        // Download and save to public/mugs/
        const imgResponse = await fetch(dalleUrl);
        const imgBuffer = await imgResponse.arrayBuffer();
        const fs = await import("fs");
        const path = await import("path");

        const filename = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + ".png";
        const publicPath = path.join(process.cwd(), "public", "mugs", filename);
        fs.writeFileSync(publicPath, Buffer.from(imgBuffer));
        imageUrl = `/mugs/${filename}`;
      }
    } catch (imgErr) {
      console.error("Image generation failed, creating mug without image:", imgErr);
      // Continue without image — mug will use emoji fallback
    }

    // Extract a short personality label from description
    const personality = description
      ? description.split(".")[0].slice(0, 50)
      : "Friendly";

    const mug = await createMug({
      name,
      home_floor,
      personality,
      personality_prompt: personalityPrompt,
      avatar_emoji: "☕",
      image_url: imageUrl || undefined,
      chat_image_url: imageUrl || undefined,
    });

    return NextResponse.json({ success: true, mug });
  } catch (error) {
    console.error("Create mug error:", error);
    return NextResponse.json(
      { error: "Failed to create mug" },
      { status: 500 }
    );
  }
}
