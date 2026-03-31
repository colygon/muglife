"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MugProfile } from "@/lib/types";
import FloorPicker from "@/components/FloorPicker";
import MugChat from "@/components/MugChat";
import QRScanner from "@/components/QRScanner";
import MugQRCode from "@/components/MugQRCode";
import MugVoiceCall from "@/components/MugVoiceCall";
import MugActivity from "@/components/MugActivity";
import { getFloorName } from "@/lib/floors";

interface Props {
  initialProfile: MugProfile;
}

export default function MugProfileClient({ initialProfile }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<MugProfile>(initialProfile);
  const [showFloorPicker, setShowFloorPicker] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showRescueConfirm, setShowRescueConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
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

    // Redirect to selfie with mug and floor pre-selected
    router.push(`/app/selfie?mug=${profile.id}&floor=${floor}`);
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

          {/* Voice call */}
          <div className="mt-3">
            <MugVoiceCall mugId={profile.id} mugName={profile.name} mugEmoji={profile.avatar_emoji} />
          </div>

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

        {/* Activity */}
        <div className="mb-8">
          <MugActivity
            scans={profile.recent_scans}
            selfies={profile.selfies}
            homeFloor={profile.home_floor}
            mugId={profile.id}
            mugName={profile.name}
          />
        </div>

        {/* QR Code */}
        <div className="mb-8">
          <MugQRCode mugId={profile.id} mugName={profile.name} />
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

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner
          onScan={(url) => {
            setShowScanner(false);
            try {
              const parsed = new URL(url);
              const path = parsed.pathname;
              const mugMatch = path.match(/\/mug\/(\d+)/);
              if (mugMatch) { router.push(`/mug/${mugMatch[1]}`); return; }
              const floorMatch = path.match(/\/floor\/([\d-]+)/);
              if (floorMatch) { router.push(`/floor/${floorMatch[1]}`); return; }
              if (parsed.hostname.includes("muglife")) { router.push(path); return; }
            } catch {}
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Dock with mug actions above */}
      <div className={`fixed bottom-0 left-0 right-0 bg-[#1a1107]/95 backdrop-blur-sm border-t border-white/10 pb-[env(safe-area-inset-bottom)] z-40 ${showFloorPicker || showRescueConfirm ? "hidden" : ""}`}>
        {/* Mug Actions */}
        <div className="max-w-lg mx-auto px-6 pt-2 pb-1">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <button
              onClick={() => setShowFloorPicker(true)}
              className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors active:scale-[0.97]"
            >
              Check In
            </button>
            {!isHome && profile.current_floor !== null ? (
              <button
                onClick={() => setShowRescueConfirm(true)}
                className="w-11 h-11 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium transition-colors active:scale-[0.97] border border-green-500/20 flex items-center justify-center"
                title="Return home"
              >
                🏠
              </button>
            ) : (
              <div className="w-11" />
            )}
            <button
              onClick={() => setShowChat(true)}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors active:scale-[0.97]"
            >
              Chat
            </button>
          </div>
        </div>
        {/* Dock nav */}
        <div className="max-w-lg mx-auto px-6 py-1 flex justify-around items-end border-t border-white/5 mt-1">
          <a href="/app?tab=feed" className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95">
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-medium">Activity</span>
          </a>
          <a href="/app?tab=tower" className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95">
            <span className="text-2xl">🏢</span>
            <span className="text-xs font-medium">Tower</span>
          </a>
          <a href="/app/selfie" className="flex flex-col items-center gap-1 -mt-5 active:scale-95">
            <div className="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-pink-400">Selfie</span>
          </a>
          <a href="/app?tab=mugs" className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95">
            <span className="text-2xl">☕</span>
            <span className="text-xs font-medium">Mugs</span>
          </a>
          <button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2M17 21h2a2 2 0 002-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-medium">Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
