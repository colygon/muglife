"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MugOnFloor } from "@/lib/types";
import TowerView from "@/components/TowerView";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1a1107] flex items-center justify-center">
      <div className="text-amber-400/50 text-sm">Loading map...</div>
    </div>
  ),
});

interface Props {
  mugs: MugOnFloor[];
}

export default function MapView({ mugs }: Props) {
  const [showTower, setShowTower] = useState(false);

  if (showTower) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        <button
          onClick={() => setShowTower(false)}
          className="flex items-center gap-1.5 text-amber-400 text-sm font-medium mb-4 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Map
        </button>
        <TowerView mugs={mugs} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bottom-[4.5rem] z-10">
      <LeafletMap onHQClick={() => setShowTower(true)} />
    </div>
  );
}
