import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { getMugProfile } from "@/lib/queries";
import { getFloorInfo } from "@/lib/floors";

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

    const mug = await getMugProfile(mugId);
    if (!mug) {
      return NextResponse.json({ error: "Mug not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert file to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Get the mug's current floor info for background theming
    const currentFloor = mug.current_floor ?? mug.home_floor;
    const floorInfo = getFloorInfo(currentFloor);
    const floorName = floorInfo?.name || "a cozy space";
    const floorDesc = floorInfo?.description || "";

    // Build floor-specific background prompt
    const backgroundPrompt = getBackgroundForFloor(currentFloor, floorName, floorDesc);

    const mugDescription = mug.personality_prompt.split("\n")[0];
    const prompt = `Transform this entire photo into a Studio Ghibli / LoFi Girl anime illustration style.

The person in the photo should be drawn as a Ghibli-style anime character:
- Keep their exact facial features, hair style, glasses, and expression recognizable
- Render them in the warm, soft, hand-painted Ghibli aesthetic with LoFi Girl chill vibes
- Soft golden-hour lighting, cozy atmosphere, gentle color palette

The person MUST be holding a kawaii cartoon mug character in their hand:
- ${mugDescription}
- Cute dot eyes, small mouth, pink blush cheeks, tiny noodle arms and legs
- The mug character should look alive, cozy, and expressive — maybe with little steam wisps
- The person's hand should be visibly wrapped around or holding the mug character
- If no mug is visible in the original photo, ADD one being held in the person's hand
- The mug should be a prominent, clearly visible element in the image

The background should match "${floorName}" — ${backgroundPrompt}

IMPORTANT:
- The person must still be clearly recognizable (same face shape, features, hair, glasses)
- The overall composition and pose should match the original photo
- Blend Ghibli's hand-painted warmth with LoFi Girl's cozy, chill aesthetic
- The background MUST reflect the ${floorName} vibe
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

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "No response from image editor" },
        { status: 500 }
      );
    }

    const inlineDataPart = parts.find(
      (p: { inlineData?: { data?: string } }) => p.inlineData?.data
    );

    if (inlineDataPart?.inlineData?.data) {
      return NextResponse.json({
        success: true,
        image: `data:image/png;base64,${inlineDataPart.inlineData.data}`,
      });
    }

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

function getBackgroundForFloor(floorNumber: number, floorName: string, floorDesc: string): string {
  const backgrounds: Record<number, string> = {
    [-1]: "An underground rave scene — neon lights, laser beams cutting through fog, dark walls with glowing graffiti, a DJ booth in the background, bass speakers, people dancing as silhouettes. Electric purple and hot pink lighting. Pure underground energy.",
    1: "A sleek modern lobby — marble floors, a reception desk, tall glass doors with city visible outside, potted plants, warm overhead lighting. Professional but welcoming.",
    2: "A massive event space — high industrial ceilings, stage lighting, rows of chairs or standing crowd silhouettes, giant screens, hackathon energy with laptops everywhere. Industrial-chic with exposed brick.",
    3: "A fitness center — gym equipment, mirrors, yoga mats, warm wood floors, motivational energy. Clean and bright with natural light.",
    4: "A cyberpunk robotics lab — robot arms, circuit boards, soldering stations, LED strips, screens showing code, mechanical parts scattered on workbenches. Blue and orange neon glow.",
    6: "An artist's studio and music space — guitars on walls, paint splatters, canvases, a drum kit in the corner, colorful murals, creative chaos. Burning Man inspired art installations.",
    7: "A makerspace workshop — 3D printers humming, laser cutters, woodworking tools, soldering irons, workbenches covered in prototypes. Creative technical energy with warm workshop lighting.",
    8: "A biopunk laboratory — microscopes, petri dishes, DNA helix displays, biotech equipment, green glowing liquids in beakers, lab coats. Science fiction meets real science.",
    9: "An AI/ML research lab — multiple monitors showing neural networks and code, GPU racks with blinking lights, whiteboards covered in equations, a futuristic but cozy workspace. Digital blue and warm amber tones.",
    10: "A startup accelerator — glass-walled meeting rooms, pitch decks on screens, founders huddled around laptops, a whiteboard with business models, VC energy. Modern, ambitious, collaborative.",
    11: "A longevity and wellness lab — biometric displays, healthy plants everywhere, meditation cushions, cold plunge tub visible, supplements on shelves. Clean, bright, health-focused aesthetic.",
    12: "An Ethereum hacker house — screens showing blockchain data, ETH logos subtly visible, developers coding intensely, privacy-focused dark aesthetic with purple and blue accents. Deep tech contemplation vibes.",
    14: "A human flourishing space — learning circles, philosophy books, regenerative garden visible through windows, warm community gathering space. Thoughtful, intentional, beautiful.",
    15: "A quiet coworking space — clean desks, noise-cancelling headphones, focused people typing, minimal decoration, soft task lighting. Productive calm.",
    16: "A luxurious rooftop lounge — panoramic city skyline view through floor-to-ceiling windows, comfortable couches, ambient lighting, cocktail glasses. Cross-pollination conversations. Top of the world feeling.",
    17: "A stunning San Francisco rooftop at golden hour — panoramic skyline with the Transamerica Pyramid, Salesforce Tower, Bay Bridge, and city lights twinkling. Open sky, string lights overhead, urban garden vibes. Wind in hair, breathtaking 360-degree views of the city below. Magical rooftop sunset energy.",
  };

  return backgrounds[floorNumber] || `A scene inspired by ${floorName}: ${floorDesc}. Cozy LoFi Girl vibes with warm amber tones.`;
}
