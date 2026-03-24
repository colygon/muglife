"use client";

import Link from "next/link";
import { ActivityEntry } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import { getFloorName } from "@/lib/floors";

interface Props {
  activities: ActivityEntry[];
}

export default function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">☕</div>
        <p className="text-white/40">No activity yet. Scan a mug to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((a) => (
        <Link
          key={a.id}
          href={`/mug/${a.mug_id}`}
          className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-colors active:scale-[0.99]"
        >
          {/* Mug avatar */}
          {a.mug_image_url ? (
            <img
              src={a.mug_image_url}
              alt={a.mug_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-lg flex-shrink-0">
              {a.mug_avatar_emoji}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80">
              <span className="font-medium text-amber-400">{a.mug_name}</span>
              {a.is_rescue ? (
                <span className="text-green-400"> rescued! Returned to {getFloorName(a.floor)}</span>
              ) : (
                <span> checked in at {getFloorName(a.floor)} <span className="text-white/30">(F{a.floor})</span></span>
              )}
            </p>
            <p className="text-xs text-white/30 mt-0.5">
              by {a.scanner_name} &middot; {timeAgo(a.created_at)}
            </p>
          </div>

          {/* Rescue badge */}
          {a.is_rescue && (
            <span className="text-green-400 text-lg flex-shrink-0">🏠</span>
          )}
        </Link>
      ))}
    </div>
  );
}
