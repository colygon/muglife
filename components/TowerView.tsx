"use client";

import Link from "next/link";
import { MugOnFloor } from "@/lib/types";
import { TOWER_FLOORS } from "@/lib/floors";

interface Props {
  mugs: MugOnFloor[];
}

export default function TowerView({ mugs }: Props) {
  // Group mugs by current floor
  const floorMap = new Map<number, MugOnFloor[]>();
  for (const mug of mugs) {
    if (mug.current_floor == null) continue;
    const existing = floorMap.get(mug.current_floor) || [];
    existing.push(mug);
    floorMap.set(mug.current_floor, existing);
  }

  // Mugs with no scans (show on home floor dimmed)
  const unscannedMugs = mugs.filter((m) => m.current_floor == null);
  for (const mug of unscannedMugs) {
    const existing = floorMap.get(mug.home_floor) || [];
    existing.push({ ...mug, current_floor: mug.home_floor });
    floorMap.set(mug.home_floor, existing);
  }

  const reversedFloors = [...TOWER_FLOORS].reverse();

  return (
    <div className="perspective-[800px]">
      <div className="space-y-1">
        {reversedFloors.map((floor) => {
          const floorMugs = floorMap.get(floor) || [];
          const hasAnyMugs = floorMugs.length > 0;

          return (
            <div
              key={floor}
              className={`relative rounded-lg border transition-colors ${
                hasAnyMugs
                  ? "bg-amber-900/15 border-amber-500/20"
                  : "bg-white/[0.02] border-white/5"
              }`}
              style={{
                transform: "rotateX(2deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="flex items-center gap-3 px-3 py-2.5 min-h-[48px]">
                {/* Floor number */}
                <span
                  className={`text-xs font-mono w-6 text-right flex-shrink-0 ${
                    hasAnyMugs ? "text-amber-400/80" : "text-white/20"
                  }`}
                >
                  {floor}
                </span>

                {/* Floor divider */}
                <div className={`w-px h-6 ${hasAnyMugs ? "bg-amber-500/20" : "bg-white/5"}`} />

                {/* Mugs on this floor */}
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {floorMugs.map((mug) => {
                    const isHome = mug.current_floor === mug.home_floor;
                    return (
                      <Link
                        key={mug.id}
                        href={`/mug/${mug.id}`}
                        className={`group flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all active:scale-95 ${
                          isHome
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                            : "bg-red-500/10 text-red-300 border border-red-500/20"
                        }`}
                        title={`${mug.name} — ${isHome ? "at home" : "away from home"}`}
                      >
                        {mug.image_url ? (
                          <img
                            src={mug.image_url}
                            alt={mug.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">{mug.avatar_emoji}</span>
                        )}
                        <span className="font-medium truncate max-w-[80px]">
                          {mug.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-4 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> at home
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" /> away
        </span>
      </div>
    </div>
  );
}
