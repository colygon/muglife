"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";

export default function AppDock() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      {showScanner && (
        <QRScanner
          onScan={(url) => {
            setShowScanner(false);
            try {
              const parsed = new URL(url);
              const path = parsed.pathname;
              const mugMatch = path.match(/\/mug\/(\d+)/);
              if (mugMatch) {
                router.push(`/mug/${mugMatch[1]}`);
                return;
              }
              const floorMatch = path.match(/\/floor\/([\d-]+)/);
              if (floorMatch) {
                router.push(`/floor/${floorMatch[1]}`);
                return;
              }
              if (parsed.hostname.includes("muglife")) {
                router.push(path);
                return;
              }
            } catch {
              // Not a URL, ignore
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1107]/95 backdrop-blur-sm border-t border-white/10 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="max-w-lg mx-auto px-6 py-2 flex justify-around items-end">
          <Link
            href="/app?tab=feed"
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-medium">Activity</span>
          </Link>
          <Link
            href="/app?tab=map"
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <span className="text-2xl">📍</span>
            <span className="text-xs font-medium">Map</span>
          </Link>

          {/* Selfie — center prominent button */}
          <Link
            href="/app/selfie"
            className="flex flex-col items-center gap-1 -mt-5 active:scale-95"
          >
            <div className="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-pink-400">Selfie</span>
          </Link>

          <Link
            href="/app?tab=mugs"
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <span className="text-2xl">☕</span>
            <span className="text-xs font-medium">Mugs</span>
          </Link>
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
    </>
  );
}
