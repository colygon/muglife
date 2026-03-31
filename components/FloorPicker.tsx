"use client";

import { useState } from "react";
import { TOWER_FLOORS } from "@/lib/floors";

interface Props {
  homeFloor: number;
  currentFloor: number | null;
  onCheckIn: (floor: number, name: string) => Promise<void>;
}

export default function FloorPicker({
  homeFloor,
  currentFloor,
  onCheckIn,
}: Props) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(
    currentFloor
  );
  const [name] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("muglife-name") || "Someone";
    }
    return "Someone";
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckIn() {
    if (!selectedFloor || !name.trim()) return;

    setSubmitting(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("muglife-name", name.trim());
      }
      await onCheckIn(selectedFloor, name.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50 text-center">
        Where is this mug right now?
      </p>

      {/* Floor grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {TOWER_FLOORS.filter((f) => f !== 17).map((floor) => (
          <button
            key={floor}
            onClick={() => setSelectedFloor(floor)}
            className={`h-12 rounded-lg font-medium text-sm transition-all active:scale-95 ${
              selectedFloor === floor
                ? "bg-amber-500 text-black"
                : floor === homeFloor
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                : "bg-white/5 text-white/60 border border-white/10 hover:border-white/20"
            }`}
          >
            {floor === -1 ? "B" : floor}
            {floor === homeFloor && selectedFloor !== floor && (
              <span className="block text-[10px] -mt-0.5 opacity-60">
                home
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleCheckIn}
        disabled={!selectedFloor || !name.trim() || submitting}
        className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors disabled:opacity-50 active:scale-[0.97]"
      >
        {submitting
          ? "Checking in..."
          : selectedFloor
          ? `Check in on Floor ${selectedFloor === -1 ? "B" : selectedFloor}`
          : "Select a floor"}
      </button>
    </div>
  );
}
