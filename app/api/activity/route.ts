import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/queries";

export async function GET() {
  try {
    const activities = await getRecentActivity(50);
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
