"use client";

import { useState } from "react";
import Link from "next/link";
import { ActivityEntry, MugOnFloor, Mug } from "@/lib/types";
import ActivityFeed from "@/components/ActivityFeed";
import TowerView from "@/components/TowerView";
import MugDirectory from "@/components/MugDirectory";

type Tab = "feed" | "tower" | "mugs";

interface Props {
  activities: ActivityEntry[];
  floorMugs: MugOnFloor[];
  allMugs: (Mug & { current_floor: number | null; total_scans: number })[];
}

export default function AppHomeClient({ activities, floorMugs, allMugs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("feed");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "feed", label: "Feed", icon: "⚡" },
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

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-1 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors active:scale-[0.97] ${
                activeTab === tab.id
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {activeTab === "feed" && <ActivityFeed activities={activities} />}
        {activeTab === "tower" && <TowerView mugs={floorMugs} />}
        {activeTab === "mugs" && <MugDirectory mugs={allMugs} />}
      </div>
    </div>
  );
}
