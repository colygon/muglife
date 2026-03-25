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
    const prompt = `Edit this selfie photo. Find the coffee mug, cup, or drinking vessel the person is holding and replace ONLY that object with a kawaii cartoon mug character.

The cartoon mug character should look like: ${mugDescription}

Style requirements for the mug character:
- Kawaii ceramic mug with cute dot eyes in the lower third of its body
- Small mouth, pink blush ovals on cheeks
- Thin black noodle arms and legs (1930s rubber-hose animation style)
- Satin-matte glaze finish
- Storybook illustration style (Adventure Time meets Animal Crossing)

CRITICAL RULES:
- Do NOT change the person's face, skin tone, hair, expression, or body
- Do NOT change the background or lighting
- ONLY replace the mug/cup with the cartoon mug character
- Keep the cartoon mug roughly the same size and position as the original
- The person should look like they're holding the cartoon character
- Make it look fun and shareable!`;

    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash-exp",
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
