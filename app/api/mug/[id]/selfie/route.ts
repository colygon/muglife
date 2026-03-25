import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { saveSelfie, getMugById, logEvent } from "@/lib/queries";

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
    const file = formData.get("image") as File;
    const author = (formData.get("author") as string) || "Anonymous";

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`selfies/mug-${mugId}-${Date.now()}.jpg`, file, {
      access: "public",
      contentType: file.type,
    });

    // Save to database
    const selfie = await saveSelfie(mugId, blob.url, author);

    logEvent("selfie", mugId, author, "Took a selfie").catch(() => {});

    return NextResponse.json({ success: true, selfie });
  } catch (error) {
    console.error("Selfie upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload selfie" },
      { status: 500 }
    );
  }
}
