"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ActivityEntry, AppEvent, MugOnFloor, Mug } from "@/lib/types";
import ActivityFeed from "@/components/ActivityFeed";
import TowerView from "@/components/TowerView";
import MugDirectory from "@/components/MugDirectory";

type Tab = "feed" | "tower" | "mugs";

interface Props {
  activities: (AppEvent | ActivityEntry)[];
  floorMugs: MugOnFloor[];
  allMugs: (Mug & { current_floor: number | null; total_scans: number })[];
}

export default function AppHomeClient({ activities: initialActivities, floorMugs: initialFloorMugs, allMugs: initialAllMugs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [activities, setActivities] = useState(initialActivities);
  const [floorMugs, setFloorMugs] = useState(initialFloorMugs);
  const [allMugs, setAllMugs] = useState(initialAllMugs);

  const refresh = useCallback(async () => {
    try {
      const [actRes, mugRes] = await Promise.all([
        fetch("/api/activity"),
        fetch("/api/mugs"),
      ]);
      if (actRes.ok) setActivities(await actRes.json());
      if (mugRes.ok) {
        const mugs = await mugRes.json();
        setAllMugs(mugs);
        // Derive floor positions from allMugs data
        setFloorMugs(
          mugs.map((m: Mug & { current_floor: number | null }) => ({
            id: m.id,
            name: m.name,
            home_floor: m.home_floor,
            avatar_emoji: m.avatar_emoji,
            image_url: m.image_url,
            current_floor: m.current_floor,
          }))
        );
      }
    } catch {
      // Silently fail — will retry on next interval
    }
  }, []);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "feed", label: "Activity", icon: "⚡" },
    { id: "tower", label: "Tower", icon: "🏢" },
    { id: "mugs", label: "Mugs", icon: "☕" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1107] text-white font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#1a1107]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-amber-400">
            MugLife
          </Link>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-full">
            {allMugs.length} mugs
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {activeTab === "feed" && <ActivityFeed activities={activities} />}
        {activeTab === "tower" && <TowerView mugs={floorMugs} />}
        {activeTab === "mugs" && <MugDirectory mugs={allMugs} onMugCreated={refresh} />}
      </div>

      {/* Bottom Dock */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1107]/95 backdrop-blur-sm border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto px-6 py-2 flex justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo(0, 0);
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors active:scale-95 ${
                activeTab === tab.id
                  ? "text-amber-400"
                  : "text-white/30"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
          <Link
            href="/app/selfie"
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-pink-400 active:scale-95"
          >
            <span className="text-xl">📸</span>
            <span className="text-[10px] font-medium">Selfie</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
