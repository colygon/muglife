"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getFloorLabel } from "@/lib/floors";
import MugQRCode from "@/components/MugQRCode";
import AppDock from "@/components/AppDock";

interface FloorData {
  floor: { number: number; name: string; shortName: string; description: string };
  mugs: Array<{
    id: number; name: string; personality: string; avatar_emoji: string;
    image_url: string | null; home_floor: number; current_floor: number | null; total_scans: number;
  }>;
  visitors: Array<{
    id: number; name: string; personality: string; avatar_emoji: string;
    image_url: string | null; home_floor: number; current_floor: number; total_scans: number;
  }>;
  activity: Array<{
    id: number; type: string; mug_id: number | null; actor: string;
    detail: string | null; created_at: string; mug_name: string | null;
    mug_emoji: string | null; mug_image: string | null;
  }>;
  selfies: Array<{
    id: number; mug_id: number; image_url: string; author: string;
    created_at: string; mug_name: string;
  }>;
}

export default function FloorProfilePage() {
  const params = useParams();
  const floorNumber = parseInt(params.number as string);
  const [data, setData] = useState<FloorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"mugs" | "activity" | "selfies">("mugs");
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/floor/${floorNumber}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [floorNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1107] flex items-center justify-center">
        <div className="text-amber-400 animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#1a1107] flex items-center justify-center text-white">
        Floor not found
      </div>
    );
  }

  const { floor, mugs, visitors, activity, selfies } = data;

  return (
    <div className="min-h-screen bg-[#1a1107] text-white font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header — Instagram-style */}
        <div className="sticky top-0 z-30 bg-[#1a1107]/95 backdrop-blur-sm border-b border-white/5">
          <div className="px-4 py-3 flex items-center gap-3">
            <Link href="/app" className="text-white/60">
              &larr;
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">
                {getFloorLabel(floor.number)} · {floor.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Floor banner */}
        <div className="px-4 py-6 border-b border-white/5">
          <div className="flex items-start gap-4">
            {/* Floor number badge */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-black text-amber-400">
                {getFloorLabel(floor.number)}
              </span>
            </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="flex gap-6 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{mugs.length}</div>
                  <div className="text-[11px] text-white/40">Residents</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{visitors.length}</div>
                  <div className="text-[11px] text-white/40">Visitors</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{selfies.length}</div>
                  <div className="text-[11px] text-white/40">Selfies</div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-white/50 mt-3 leading-relaxed">
            {floor.description}
          </p>
        </div>

        {/* Tab bar — Instagram-style */}
        <div className="flex border-b border-white/5 sticky top-[52px] z-20 bg-[#1a1107]/95 backdrop-blur-sm">
          {[
            { id: "mugs" as const, label: "Mugs", icon: "☕" },
            { id: "activity" as const, label: "Activity", icon: "⚡" },
            { id: "selfies" as const, label: "Selfies", icon: "📸" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors relative ${
                activeSection === tab.id ? "text-amber-400" : "text-white/30"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
              {activeSection === tab.id && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {activeSection === "mugs" && (
            <div className="space-y-6">
              {/* Residents */}
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                  Residents ({mugs.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {mugs.map((mug) => (
                    <Link
                      key={mug.id}
                      href={`/mug/${mug.id}`}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-all active:scale-95"
                    >
                      {mug.image_url ? (
                        <img src={mug.image_url} alt={mug.name} className="w-14 h-14 rounded-full object-cover border border-amber-500/20" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-2xl border border-amber-500/20">
                          {mug.avatar_emoji}
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-xs font-medium text-white truncate w-full">{mug.name}</p>
                        <p className="text-[10px] text-white/30">{mug.total_scans} scans</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Visitors */}
              {visitors.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    Visiting ({visitors.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {visitors.map((mug) => (
                      <Link
                        key={mug.id}
                        href={`/mug/${mug.id}`}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all active:scale-95"
                      >
                        {mug.image_url ? (
                          <img src={mug.image_url} alt={mug.name} className="w-14 h-14 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                            {mug.avatar_emoji}
                          </div>
                        )}
                        <div className="text-center">
                          <p className="text-xs font-medium text-white truncate w-full">{mug.name}</p>
                          <p className="text-[10px] text-amber-400/60">from F{mug.home_floor}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Code */}
              <div className="mt-4">
                <MugQRCode mugId={floorNumber} mugName={`Floor ${getFloorLabel(floorNumber)}`} isFloor />
              </div>
            </div>
          )}

          {activeSection === "activity" && (
            <div className="space-y-3">
              {activity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm">No activity yet on this floor</p>
                </div>
              ) : (
                activity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                    {event.mug_image ? (
                      <img src={event.mug_image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-sm flex-shrink-0">
                        {event.mug_emoji || "☕"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70">
                        <span className="text-white font-medium">{event.actor}</span>
                        {" "}
                        {event.type === "checkin" && "checked in"}
                        {event.type === "rescue" && "rescued"}
                        {event.type === "selfie" && "took a selfie with"}
                        {event.type === "mug_created" && "created"}
                        {event.type === "chat" && "chatted with"}
                        {" "}
                        {event.mug_name && (
                          <Link href={`/mug/${event.mug_id}`} className="text-amber-400 font-medium">
                            {event.mug_name}
                          </Link>
                        )}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">
                        {new Date(event.created_at).toLocaleDateString()} {new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSection === "selfies" && (
            <div>
              {selfies.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-white/30 text-sm">No selfies yet on this floor</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {selfies.map((selfie) => (
                    <button
                      key={selfie.id}
                      onClick={() => setViewingImage(selfie.image_url)}
                      className="aspect-square overflow-hidden relative group"
                    >
                      <img
                        src={selfie.image_url}
                        alt={`Selfie with ${selfie.mug_name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white/80 truncate">{selfie.mug_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
            alt="Selfie"
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
          />
        </div>
      )}

      {/* Bottom dock */}
      <AppDock />
    </div>
  );
}
