import { NextResponse } from "next/server";
import { getAllMugs } from "@/lib/queries";

export async function GET() {
  try {
    const mugs = await getAllMugs();
    return NextResponse.json(mugs);
  } catch (error) {
    console.error("Mugs list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mugs" },
      { status: 500 }
    );
  }
}
