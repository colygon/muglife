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
    const prompt = `Transform this entire photo into a Studio Ghibli / Hayao Miyazaki anime illustration style.

The person in the photo should be drawn as a Ghibli-style anime character:
- Keep their exact facial features, hair style, glasses, and expression recognizable
- Render them in the warm, soft, hand-painted Ghibli aesthetic
- Soft lighting, dreamy atmosphere, watercolor-like textures

The mug or cup they are holding (or nearby) should become a kawaii cartoon mug character:
- ${mugDescription}
- Cute dot eyes, small mouth, pink blush cheeks, tiny noodle arms and legs
- The mug character should look alive and expressive

The background should also be transformed into a cozy Ghibli-style scene — warm colors, soft details, perhaps a hint of magic in the air.

IMPORTANT:
- The person must still be clearly recognizable (same face shape, features, hair, glasses)
- The overall composition and pose should match the original photo
- Make it look like a frame from a Ghibli film — magical, warm, and beautiful
- This should be shareable and make people go "wow!"`;


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
