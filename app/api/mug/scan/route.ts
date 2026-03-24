import { NextRequest, NextResponse } from "next/server";
import { logScan, getMugById } from "@/lib/queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mug_id, floor, scanner_name, is_rescue } = body;

    if (!mug_id || !floor) {
      return NextResponse.json(
        { error: "mug_id and floor are required" },
        { status: 400 }
      );
    }

    const mug = await getMugById(mug_id);
    if (!mug) {
      return NextResponse.json({ error: "Mug not found" }, { status: 404 });
    }

    const scan = await logScan(
      mug_id,
      floor,
      scanner_name || "Anonymous",
      is_rescue || false
    );

    return NextResponse.json({ success: true, scan });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Failed to log scan" },
      { status: 500 }
    );
  }
}
