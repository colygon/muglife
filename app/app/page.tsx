import { Suspense } from "react";
import { getEvents, getRecentActivity, getMugsByCurrentFloor, getAllMugs } from "@/lib/queries";
import { Metadata } from "next";
import AppHomeClient from "./AppHomeClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MugLife — The Tower",
  description: "Track, chat with, and rescue coffee mugs across the Tower.",
};

export default async function AppHomePage() {
  const [events, floorMugs, allMugs] = await Promise.all([
    getEvents(200).catch(() => []),
    getMugsByCurrentFloor(),
    getAllMugs(),
  ]);

  // Use events if available, otherwise fall back to scan-based activity
  const activities = events.length > 0 ? events : await getRecentActivity(500);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1107]" />}>
      <AppHomeClient
        activities={activities}
        floorMugs={floorMugs}
        allMugs={allMugs}
      />
    </Suspense>
  );
}
