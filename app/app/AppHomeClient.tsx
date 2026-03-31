"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ActivityEntry, AppEvent, MugOnFloor, Mug } from "@/lib/types";
import ActivityFeed from "@/components/ActivityFeed";
import MugDirectory from "@/components/MugDirectory";
import QRScanner from "@/components/QRScanner";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Tab = "feed" | "map" | "mugs";

interface Props {
  activities: (AppEvent | ActivityEntry)[];
  floorMugs: MugOnFloor[];
  allMugs: (Mug & { current_floor: number | null; total_scans: number })[];
}

export default function AppHomeClient({ activities: initialActivities, floorMugs: initialFloorMugs, allMugs: initialAllMugs }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "feed";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [showScanner, setShowScanner] = useState(false);
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

  const tabsBefore: { id: Tab; label: string; icon: string }[] = [
    { id: "feed", label: "Activity", icon: "⚡" },
    { id: "map", label: "Map", icon: "📍" },
  ];
  const tabsAfter: { id: Tab; label: string; icon: string }[] = [
    { id: "mugs", label: "Mugs", icon: "☕" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1107] text-white font-[family-name:var(--font-geist-sans)]">
      {/* Header — hidden on map tab */}
      {activeTab !== "map" && (
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
      )}

      {/* Content */}
      {activeTab === "map" ? (
        <MapView mugs={floorMugs} />
      ) : (
        <div className="max-w-lg mx-auto px-4 py-4 pb-24">
          {activeTab === "feed" && <ActivityFeed activities={activities} />}
          {activeTab === "mugs" && <MugDirectory mugs={allMugs} onMugCreated={refresh} />}
        </div>
      )}

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner
          onScan={(url) => {
            setShowScanner(false);
            // Parse the scanned URL to navigate
            try {
              const parsed = new URL(url);
              const path = parsed.pathname;
              // Handle mug URLs: /mug/123
              const mugMatch = path.match(/\/mug\/(\d+)/);
              if (mugMatch) {
                router.push(`/mug/${mugMatch[1]}`);
                return;
              }
              // Handle floor URLs: /floor/9
              const floorMatch = path.match(/\/floor\/([\d-]+)/);
              if (floorMatch) {
                router.push(`/floor/${floorMatch[1]}`);
                return;
              }
              // If it's a muglife URL but unknown path, just navigate
              if (parsed.hostname.includes("muglife")) {
                router.push(path);
                return;
              }
            } catch {
              // Not a URL, ignore
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Bottom Dock */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1107]/95 backdrop-blur-sm border-t border-white/10 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="max-w-lg mx-auto px-6 py-2 flex justify-around items-end">
          {tabsBefore.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo(0, 0);
              }}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors active:scale-95 text-amber-400"
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}

          {/* Selfie — center prominent button */}
          <Link
            href="/app/selfie"
            className="flex flex-col items-center gap-1 -mt-5 active:scale-95"
          >
            <div className="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-pink-400">Selfie</span>
          </Link>

          {tabsAfter.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo(0, 0);
              }}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors active:scale-95 text-amber-400"
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}

          <button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2M17 21h2a2 2 0 002-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-medium">Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
