"use client";

import { useState } from "react";
import Link from "next/link";
import { Scan, Selfie } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import { getFloorName } from "@/lib/floors";

interface Props {
  scans: Scan[];
  selfies: Selfie[];
  homeFloor: number;
  mugId: number;
  mugName: string;
}

type ActivityItem =
  | { type: "scan"; data: Scan; date: string }
  | { type: "selfie"; data: Selfie; date: string };

export default function MugActivity({ scans, selfies, homeFloor, mugId, mugName }: Props) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Merge and sort by date descending
  const items: ActivityItem[] = [
    ...scans.map((s) => ({ type: "scan" as const, data: s, date: s.created_at })),
    ...selfies.map((s) => ({ type: "selfie" as const, data: s, date: s.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-amber-200">Activity</h2>
        <Link
          href={`/app/selfie?mug=${mugId}`}
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors active:scale-95"
        >
          📸 Take Selfie
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">👀</div>
          <p className="text-white/40 text-sm">No activity yet. Scan {mugName} to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            if (item.type === "scan") {
              const scan = item.data;
              const isHome = scan.floor === homeFloor;
              const isRescue = scan.is_rescue;
              return (
                <div
                  key={`scan-${scan.id}`}
                  className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                    isRescue ? "bg-green-500/15" : isHome ? "bg-amber-500/15" : "bg-white/5"
                  }`}>
                    {isRescue ? "🏠" : "📍"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {isRescue ? (
                        <span className="text-green-400">Rescued! Returned to {getFloorName(scan.floor)}</span>
                      ) : (
                        <span className="text-white/80">Checked in at <span className="font-medium text-amber-400">{getFloorName(scan.floor)}</span></span>
                      )}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      by {scan.scanner_name} &middot; {timeAgo(scan.created_at)}
                    </p>
                  </div>
                </div>
              );
            }

            // Selfie
            const selfie = item.data;
            return (
              <div
                key={`selfie-${selfie.id}`}
                className="rounded-xl bg-white/5 border border-white/5 overflow-hidden"
              >
                <div className="flex gap-3 items-start p-3 pb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-500/15 flex items-center justify-center text-lg flex-shrink-0">
                    📸
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="text-pink-400">Took a selfie!</span>
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      by {selfie.author} &middot; {timeAgo(selfie.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingImage(selfie.image_url)}
                  className="w-full"
                >
                  <img
                    src={selfie.image_url}
                    alt={`Selfie with ${mugName}`}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl"
            onClick={() => setViewingImage(null)}
          >
            &times;
          </button>
          <img
            src={viewingImage}
            alt={`Selfie with ${mugName}`}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
