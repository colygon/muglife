"use client";

import { useState } from "react";
import Link from "next/link";
import { MugProfile } from "@/lib/types";
import TravelTimeline from "@/components/TravelTimeline";
import FloorPicker from "@/components/FloorPicker";
import SelfieGallery from "@/components/SelfieGallery";
import MugChat from "@/components/MugChat";
import { getFloorName } from "@/lib/floors";

interface Props {
  initialProfile: MugProfile;
}

export default function MugProfileClient({ initialProfile }: Props) {
  const [profile, setProfile] = useState<MugProfile>(initialProfile);
  const [showFloorPicker, setShowFloorPicker] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showRescueConfirm, setShowRescueConfirm] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);

  const isHome =
    profile.current_floor !== null &&
    profile.current_floor === profile.home_floor;

  async function refreshProfile() {
    const res = await fetch(`/api/mug/${profile.id}`);
    if (res.ok) {
      setProfile(await res.json());
    }
  }

  async function handleCheckIn(floor: number, scannerName: string) {
    const isRescue = floor === profile.home_floor;

    const res = await fetch("/api/mug/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mug_id: profile.id,
        floor,
        scanner_name: scannerName,
        is_rescue: isRescue,
      }),
    });

    if (!res.ok) return;

    await refreshProfile();

    setShowFloorPicker(false);

    if (isRescue) {
      setCheckInMessage(
        `You brought ${profile.name} home! 🎉 +10 rescue points!`
      );
    } else {
      setCheckInMessage(
        `Checked in on Floor ${floor}. ${profile.name} says thanks for the visit.`
      );
    }

    setTimeout(() => setCheckInMessage(null), 4000);
  }

  return (
    <div className="min-h-screen bg-[#1a1107] text-white font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-40">
        {/* Toast message */}
        {checkInMessage && (
          <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-lg">
            <div className="bg-amber-500 text-black px-4 py-3 rounded-xl font-medium text-sm text-center shadow-lg animate-slide-down">
              {checkInMessage}
            </div>
          </div>
        )}

        {/* Mug Character */}
        <div className="flex flex-col items-center mb-8">
          {/* Character portrait */}
          {profile.image_url ? (
            <img
              src={profile.image_url}
              alt={profile.name}
              className="w-40 h-40 rounded-2xl object-cover mb-4 border-2 border-amber-500/20"
            />
          ) : (
            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-800/10 border-2 border-amber-500/20 flex items-center justify-center text-7xl mb-4">
              {profile.avatar_emoji}
            </div>
          )}

          <h1 className="text-3xl font-bold text-amber-400">
            {profile.name}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            &ldquo;{profile.personality}&rdquo;
          </p>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Home: {getFloorName(profile.home_floor)}
            </span>
            {profile.current_floor !== null && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  isHome
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {isHome
                  ? "At home!"
                  : `At: ${getFloorName(profile.current_floor!)}`}
              </span>
            )}
            {profile.days_away > 0 && !isHome && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/40 border border-white/10">
                Away {profile.days_away}d
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/40 border border-white/10">
              {profile.total_scans} scans
            </span>
          </div>
        </div>

        {/* Steam divider */}
        <div className="flex justify-center gap-1 mb-6 opacity-20">
          <div className="w-1 h-6 bg-white/40 rounded-full animate-steam-1" />
          <div className="w-1 h-8 bg-white/40 rounded-full animate-steam-2" />
          <div className="w-1 h-5 bg-white/40 rounded-full animate-steam-3" />
        </div>

        {/* Travel History */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-amber-200 mb-4">
            Travel History
          </h2>
          <TravelTimeline
            scans={profile.recent_scans}
            homeFloor={profile.home_floor}
          />
        </div>

        {/* Selfie Gallery */}
        <div className="mb-8">
          <SelfieGallery
            selfies={profile.selfies}
            mugId={profile.id}
            mugName={profile.name}
            onSelfieAdded={refreshProfile}
          />
        </div>

        {/* Guestbook */}
        {profile.recent_messages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-amber-200 mb-4">
              Messages
            </h2>
            <div className="space-y-3">
              {profile.recent_messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <p className="text-sm text-white/70">{msg.message}</p>
                  <p className="text-xs text-white/30 mt-1">
                    — {msg.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rescue Confirmation */}
        {showRescueConfirm && (
          <div className="fixed inset-0 z-40" onClick={() => setShowRescueConfirm(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-[#1a1107] border-t border-green-500/20 rounded-t-2xl p-6 pb-8 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="text-center space-y-4">
                <div className="text-4xl">🏠</div>
                <h3 className="text-lg font-semibold text-white">
                  Bring {profile.name} home?
                </h3>
                <p className="text-white/50 text-sm">
                  You&apos;re returning <span className="text-amber-400 font-medium">{profile.name}</span> to{" "}
                  <span className="text-green-400 font-medium">{getFloorName(profile.home_floor)} (Floor {profile.home_floor})</span>.
                  {" "}This is a rescue mission!
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowRescueConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowRescueConfirm(false);
                      const name =
                        typeof window !== "undefined"
                          ? localStorage.getItem("muglife-name") || "Someone"
                          : "Someone";
                      handleCheckIn(profile.home_floor, name);
                    }}
                    className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold transition-colors active:scale-[0.97]"
                  >
                    Rescue {profile.name}!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Overlay */}
        {showChat && (
          <MugChat
            mugId={profile.id}
            mugName={profile.name}
            mugEmoji={profile.avatar_emoji}
            chatImageUrl={profile.chat_image_url}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Floor Picker (bottom sheet style) */}
        {showFloorPicker && (
          <div className="fixed inset-0 z-40" onClick={() => setShowFloorPicker(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-[#1a1107] border-t border-amber-500/20 rounded-t-2xl p-6 pb-8 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <FloorPicker
                homeFloor={profile.home_floor}
                currentFloor={profile.current_floor}
                onCheckIn={handleCheckIn}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1107]/95 backdrop-blur-sm border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        {/* Mug Actions */}
        <div className="max-w-lg mx-auto px-4 pt-3 pb-1 flex gap-3">
          <button
            onClick={() => setShowFloorPicker(true)}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors active:scale-[0.97]"
          >
            Check In
          </button>
          <button
            onClick={() => setShowChat(true)}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors active:scale-[0.97]"
          >
            Chat
          </button>
          {!isHome && profile.current_floor !== null && (
            <button
              onClick={() => setShowRescueConfirm(true)}
              className="py-2.5 px-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium transition-colors active:scale-[0.97] border border-green-500/20"
              title="Return home"
            >
              🏠
            </button>
          )}
        </div>
        {/* App Dock */}
        <div className="max-w-lg mx-auto px-6 py-1 flex justify-around border-t border-white/5 mt-1">
          <Link
            href="/app"
            className="flex flex-col items-center gap-0.5 py-1 px-4 text-white/30 active:scale-95"
          >
            <span className="text-lg">⚡</span>
            <span className="text-[10px] font-medium">Feed</span>
          </Link>
          <Link
            href="/app"
            className="flex flex-col items-center gap-0.5 py-1 px-4 text-white/30 active:scale-95"
          >
            <span className="text-lg">🏢</span>
            <span className="text-[10px] font-medium">Tower</span>
          </Link>
          <Link
            href="/app"
            className="flex flex-col items-center gap-0.5 py-1 px-4 text-white/30 active:scale-95"
          >
            <span className="text-lg">☕</span>
            <span className="text-[10px] font-medium">Mugs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
