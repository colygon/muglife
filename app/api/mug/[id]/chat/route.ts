import { NextRequest, NextResponse } from "next/server";
import { getMugProfile, logEvent } from "@/lib/queries";
import { chatWithMug } from "@/lib/claude";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mugId = parseInt(params.id);
    if (isNaN(mugId)) {
      return NextResponse.json({ error: "Invalid mug ID" }, { status: 400 });
    }

    const profile = await getMugProfile(mugId);
    if (!profile) {
      return NextResponse.json({ error: "Mug not found" }, { status: 404 });
    }

    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await chatWithMug(profile, message, history);

    // Log first message only (not every back-and-forth)
    if (history.length === 0) {
      logEvent("chat", mugId, "Someone", `Started chatting`).catch(() => {});
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to chat with mug" },
      { status: 500 }
    );
  }
}
