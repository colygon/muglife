import { NextRequest, NextResponse } from "next/server";
import { getMugProfile } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid mug ID" }, { status: 400 });
    }

    const profile = await getMugProfile(id);
    if (!profile) {
      return NextResponse.json({ error: "Mug not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching mug:", error);
    return NextResponse.json(
      { error: "Failed to fetch mug" },
      { status: 500 }
    );
  }
}
