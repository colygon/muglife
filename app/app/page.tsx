import { getRecentActivity, getMugsByCurrentFloor, getAllMugs } from "@/lib/queries";
import { Metadata } from "next";
import AppHomeClient from "./AppHomeClient";

export const metadata: Metadata = {
  title: "MugLife — The Tower",
  description: "Track, chat with, and rescue coffee mugs across the Tower.",
};

export default async function AppHomePage() {
  const [activities, floorMugs, allMugs] = await Promise.all([
    getRecentActivity(500),
    getMugsByCurrentFloor(),
    getAllMugs(),
  ]);

  return (
    <AppHomeClient
      activities={activities}
      floorMugs={floorMugs}
      allMugs={allMugs}
    />
  );
}
