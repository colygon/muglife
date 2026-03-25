import { NextResponse } from "next/server";
import { getEvents, getRecentActivity } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Try events table first (richer data), fall back to scans
    const events = await getEvents(200);
    if (events.length > 0) {
      return NextResponse.json(events);
    }

    // Fallback: use scan-based activity for backwards compat
    const activities = await getRecentActivity(500);
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
