"use client";

import Link from "next/link";
import { AppEvent, ActivityEntry } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import { getFloorName } from "@/lib/floors";

interface Props {
  activities: (AppEvent | ActivityEntry)[];
}

function isAppEvent(a: AppEvent | ActivityEntry): a is AppEvent {
  return "type" in a;
}

function getEventText(event: AppEvent): { text: string; color: string; icon: string } {
  switch (event.type) {
    case "checkin":
      return {
        text: `checked in at ${event.detail ? getFloorName(parseInt(event.detail.replace("Floor ", ""))) : "unknown"}`,
        color: "text-white/80",
        icon: "",
      };
    case "rescue":
      return {
        text: `rescued! Returned to ${event.detail ? getFloorName(parseInt(event.detail.replace("Floor ", ""))) : "home"}`,
        color: "text-green-400",
        icon: "🏠",
      };
    case "mug_created":
      return {
        text: "was born into Mugsville!",
        color: "text-amber-400",
        icon: "🎉",
      };
    case "selfie":
      return {
        text: "took a selfie!",
        color: "text-pink-400",
        icon: "📸",
      };
    case "chat":
      return {
        text: "started a conversation",
        color: "text-blue-400",
        icon: "💬",
      };
    case "message":
      return {
        text: "got a new message",
        color: "text-purple-400",
        icon: "✉️",
      };
    default:
      return { text: event.detail || "something happened", color: "text-white/80", icon: "" };
  }
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
      {activities.map((a, i) => {
        if (isAppEvent(a)) {
          // New event format
          const { text, color, icon } = getEventText(a);
          const hasSelfieImage = a.type === "selfie" && a.selfie_image_url;
          return (
            <Link
              key={`event-${a.id}`}
              href={a.mug_id ? `/mug/${a.mug_id}` : "/app"}
              className={`block rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-colors active:scale-[0.99] overflow-hidden ${
                hasSelfieImage ? "" : "p-3"
              }`}
            >
              <div className={`flex gap-3 items-start ${hasSelfieImage ? "p-3 pb-2" : ""}`}>
                {a.mug_image_url ? (
                  <img
                    src={a.mug_image_url}
                    alt={a.mug_name || ""}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-lg flex-shrink-0">
                    {a.mug_avatar_emoji || "☕"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-amber-400">{a.mug_name || "A mug"}</span>{" "}
                    <span className={color}>{text}</span>
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    by {a.actor} &middot; {timeAgo(a.created_at)}
                  </p>
                </div>
                {icon && !hasSelfieImage && <span className="text-lg flex-shrink-0">{icon}</span>}
              </div>
              {hasSelfieImage && (
                <img
                  src={a.selfie_image_url!}
                  alt={`${a.mug_name || "Mug"} selfie`}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
              )}
            </Link>
          );
        }

        // Legacy scan-based activity format
        return (
          <Link
            key={`scan-${a.id}`}
            href={`/mug/${a.mug_id}`}
            className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-colors active:scale-[0.99]"
          >
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
            {a.is_rescue && <span className="text-green-400 text-lg flex-shrink-0">🏠</span>}
          </Link>
        );
      })}
    </div>
  );
}
