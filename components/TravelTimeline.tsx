"use client";

import { Scan } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface Props {
  scans: Scan[];
  homeFloor: number;
}

export default function TravelTimeline({ scans, homeFloor }: Props) {
  if (scans.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">&#128065;</div>
        <p className="text-white/40 text-sm">No scans yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {scans.map((scan, i) => {
        const isHome = scan.floor === homeFloor;
        const isRescue = scan.is_rescue;

        return (
          <div key={scan.id} className="flex gap-3 items-start">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                  isRescue
                    ? "bg-green-400"
                    : isHome
                    ? "bg-amber-400"
                    : "bg-white/20"
                }`}
              />
              {i < scans.length - 1 && (
                <div className="w-px flex-1 min-h-[24px] bg-white/10" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-white/80">
                  Floor {scan.floor}
                  {isHome && (
                    <span className="text-amber-400 ml-1 text-xs">home</span>
                  )}
                  {isRescue && (
                    <span className="text-green-400 ml-1 text-xs">
                      rescued!
                    </span>
                  )}
                </span>
                <span className="text-xs text-white/30">
                  {timeAgo(scan.created_at)}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5">
                by {scan.scanner_name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
