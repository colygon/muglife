import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { getMugById } from "@/lib/queries";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mugId = parseInt(params.id);
    if (isNaN(mugId)) {
      return NextResponse.json({ error: "Invalid mug ID" }, { status: 400 });
    }

    const mug = await getMugById(mugId);
    if (!mug) {
      return NextResponse.json({ error: "Mug not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert file to base64 (strip data: prefix if present)
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Build the mugify prompt
    const mugDescription = mug.personality_prompt.split("\n")[0];
    const prompt = `Transform this entire photo into a Studio Ghibli / LoFi Girl anime illustration style.

The person in the photo should be drawn as a Ghibli-style anime character:
- Keep their exact facial features, hair style, glasses, and expression recognizable
- Render them in the warm, soft, hand-painted Ghibli aesthetic with LoFi Girl chill vibes
- Soft golden-hour lighting, cozy atmosphere, gentle color palette

The mug or cup they are holding (or nearby) should become a kawaii cartoon mug character:
- ${mugDescription}
- Cute dot eyes, small mouth, pink blush cheeks, tiny noodle arms and legs
- The mug character should look alive, cozy, and expressive — maybe with little steam wisps

The background should be transformed into a cozy LoFi Girl / Ghibli hybrid scene:
- Warm amber and soft purple tones, like a rainy evening study session
- Cozy indoor details: plants on windowsills, fairy lights, stacked books, a cat maybe
- Rain or city lights visible through a window
- Soft lo-fi aesthetic with that nostalgic, peaceful, "I could study here forever" feeling

IMPORTANT:
- The person must still be clearly recognizable (same face shape, features, hair, glasses)
- The overall composition and pose should match the original photo
- Blend Ghibli's hand-painted warmth with LoFi Girl's cozy, chill aesthetic
- This should be shareable and make people go "wow — I want to live in this picture!"`;


    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: imageFile.type || "image/jpeg",
            },
          },
        ],
      },
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract the generated image from the response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "No response from image editor" },
        { status: 500 }
      );
    }

    // Find the inline image data
    const inlineDataPart = parts.find(
      (p: { inlineData?: { data?: string } }) => p.inlineData?.data
    );

    if (inlineDataPart?.inlineData?.data) {
      return NextResponse.json({
        success: true,
        image: `data:image/png;base64,${inlineDataPart.inlineData.data}`,
      });
    }

    // No image generated — return text error
    const textPart = parts.find((p: { text?: string }) => p.text);
    return NextResponse.json(
      { error: textPart?.text || "Could not generate edited image" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Mugify error:", error);
    return NextResponse.json(
      { error: "Failed to mugify selfie" },
      { status: 500 }
    );
  }
}
