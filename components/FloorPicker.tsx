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
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("muglife-name") || "";
    }
    return "";
  });
  const [submitting, setSubmitting] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);

  async function handleCheckIn() {
    if (!selectedFloor) return;

    // If no name saved, ask for it
    if (!name.trim()) {
      setShowNameInput(true);
      return;
    }

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
      {showNameInput && !name.trim() ? (
        <div className="space-y-3">
          <label className="block text-sm text-amber-200/80">
            What&apos;s your name?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) handleCheckIn();
            }}
          />
          <button
            onClick={handleCheckIn}
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors disabled:opacity-50"
          >
            Check In
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-white/50 text-center">
            Where is this mug right now?
          </p>

          {/* Floor grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {TOWER_FLOORS.map((floor) => (
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
                {floor}
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
            disabled={!selectedFloor || submitting}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors disabled:opacity-50 active:scale-[0.97]"
          >
            {submitting
              ? "Checking in..."
              : selectedFloor
              ? `Check in on Floor ${selectedFloor}`
              : "Select a floor"}
          </button>
        </>
      )}
    </div>
  );
}
