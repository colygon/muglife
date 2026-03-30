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
            href="/app"
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-medium">Activity</span>
          </Link>
          <Link
            href="/app"
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <span className="text-2xl">🏢</span>
            <span className="text-xs font-medium">Tower</span>
          </Link>

          {/* QR Scanner — center prominent button */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-1 -mt-5 active:scale-95"
          >
            <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2M17 21h2a2 2 0 002-2v-2" />
                <rect x="7" y="7" width="10" height="10" rx="1" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-medium text-amber-400">Scan</span>
          </button>

          <Link
            href="/app"
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-amber-400 active:scale-95"
          >
            <span className="text-2xl">☕</span>
            <span className="text-xs font-medium">Mugs</span>
          </Link>
          <Link
            href="/app/selfie"
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-pink-400 active:scale-95"
          >
            <span className="text-2xl">📸</span>
            <span className="text-xs font-medium">Selfie</span>
          </Link>
        </div>
      </div>
    </>
  );
}
