"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Mug } from "@/lib/types";
import { FLOORS, getFloorLabel } from "@/lib/floors";

export default function SelfiePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black" />}>
      <SelfiePageInner />
    </Suspense>
  );
}

function SelfiePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedMugId = searchParams.get("mug");
  const preselectedFloor = searchParams.get("floor");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mugs, setMugs] = useState<(Mug & { current_floor: number | null })[]>([]);
  const [selectedMug, setSelectedMug] = useState<Mug | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [mugifying, setMugifying] = useState(false);
  const [mugifiedImage, setMugifiedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load mugs
  useEffect(() => {
    fetch("/api/mugs")
      .then((r) => r.json())
      .then((data) => {
        setMugs(data);
        if (preselectedMugId) {
          const preselected = data.find((m: Mug) => m.id === parseInt(preselectedMugId));
          if (preselected) {
            setSelectedMug(preselected);
            setSelectedFloor(
              preselectedFloor ? parseInt(preselectedFloor) : (preselected.current_floor ?? preselected.home_floor)
            );
            setMugLocked(true);
          }
        } else if (preselectedFloor) {
          const floor = parseInt(preselectedFloor);
          setSelectedFloor(floor);
          const homesHere = data.filter((m: Mug) => m.home_floor === floor);
          if (homesHere[0]) setSelectedMug(homesHere[0]);
        } else {
          // Default to Rooftop
          setSelectedFloor(17);
          setSelectedMug(data[0] || null);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedMugId]);

  const [mugLocked, setMugLocked] = useState(false); // true when coming from a mug profile

  // When floor changes, pick a mug on that floor (only if mug not locked)
  function selectFloor(floor: number) {
    setSelectedFloor(floor);
    if (!mugLocked) {
      const homesHere = mugs.filter((m) => m.home_floor === floor);
      const onFloor = mugs.filter((m) => m.current_floor === floor);
      const candidate = homesHere[0] || onFloor[0] || mugs[0] || null;
      setSelectedMug(candidate);
    }
  }

  // Mugs available for the selected floor (fall back to all mugs if none on this floor)
  const floorSpecificMugs = selectedFloor !== null
    ? mugs.filter((m) => m.home_floor === selectedFloor || m.current_floor === selectedFloor)
    : [];
  const floorMugs = floorSpecificMugs.length > 0 ? floorSpecificMugs : mugs;

  function unlockMug() {
    setMugLocked(false);
    // Re-pick from current floor
    if (selectedFloor !== null) {
      const homesHere = mugs.filter((m) => m.home_floor === selectedFloor);
      setSelectedMug(homesHere[0] || null);
    }
  }

  // Start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1080 } },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        setError("Camera access denied. Please allow camera permissions.");
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    // Draw raw frame — no flip. The video preview CSS mirrors it for the user,
    // but the raw capture is the correct orientation for Gemini.
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);

    // Stop camera
    stream?.getTracks().forEach((t) => t.stop());

    // Mugify the selfie — only the mugified version gets saved (on Save/Share)
    if (selectedMug) {
      mugifyPhoto(dataUrl, selectedMug.id);
    }
  }

  async function mugifyPhoto(dataUrl: string, mugId: number) {
    setMugifying(true);
    try {
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("image", blob, "selfie.jpg");

      const mugifyRes = await fetch(`/api/mug/${mugId}/mugify`, {
        method: "POST",
        body: formData,
      });

      if (mugifyRes.ok) {
        const data = await mugifyRes.json();
        if (data.image) {
          setMugifiedImage(data.image);
        } else {
          setError("Couldn't generate the mugified image. Try again!");
        }
      } else {
        setError("Mugify failed. Try again!");
      }
    } catch {
      setError("Something went wrong. Try again!");
    }
    setMugifying(false);
  }

  function handleRetake() {
    setCaptured(null);
    setMugifiedImage(null);
    setMugifying(false);
    setError(null);
    setSaved(false);
    // Restart camera
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch(() => {});
  }

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!mugifiedImage || !selectedMug) return;
    setSaving(true);
    try {
      // Convert data URL to blob
      const res = await fetch(mugifiedImage);
      const blob = await res.blob();

      // Upload to mug's selfie gallery
      const fd = new FormData();
      fd.append("image", blob, "mugified-selfie.png");
      fd.append("author", localStorage.getItem("muglife-name") || "Anonymous");
      const uploadRes = await fetch(`/api/mug/${selectedMug.id}/selfie`, { method: "POST", body: fd });

      if (uploadRes.ok) {
        setSaved(true);
        // Navigate back to the mug profile so they can see the selfie
        setTimeout(() => {
          router.push(`/mug/${selectedMug.id}`);
        }, 500);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  }

  function handleShare() {
    if (!mugifiedImage || !navigator.share) return;

    // Save to gallery in background when sharing too
    if (selectedMug && !saved) {
      fetch(mugifiedImage)
        .then((r) => r.blob())
        .then((blob) => {
          const fd = new FormData();
          fd.append("image", blob, "mugified-selfie.png");
          fd.append("author", localStorage.getItem("muglife-name") || "Anonymous");
          fetch(`/api/mug/${selectedMug.id}/selfie`, { method: "POST", body: fd });
          setSaved(true);
        })
        .catch(() => {});
    }

    fetch(mugifiedImage)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], "muglife-selfie.png", { type: "image/png" });
        navigator.share({ files: [file], title: "My MugLife Selfie!" }).catch(() => {});
      });
  }

  return (
    <div className="h-screen max-h-screen bg-black text-white font-[family-name:var(--font-geist-sans)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
        <Link href="/app" className="text-white/60 text-sm">
          &larr; Back
        </Link>
        <span className="text-amber-400 font-bold">MugLife Selfie</span>
        <div className="w-12" />
      </div>

      {/* Camera / Result with vertical floor selector */}
      <div className="flex-1 min-h-0 relative flex bg-black overflow-hidden">
        {/* Main camera/result area */}
        <div className="flex-1 relative flex items-center justify-center">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-full"
              style={{ transform: "scaleX(-1)" }}
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <p className="text-white/60 text-center px-8">{error}</p>
              </div>
            )}
          </>
        ) : mugifiedImage ? (
          <img src={mugifiedImage} alt="Mugified selfie" className="w-full h-full object-contain" />
        ) : captured ? (
          <div className="relative w-full h-full">
            <img src={captured} alt="Captured" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {mugifying ? (
                <>
                  <svg className="w-12 h-12 animate-spin text-amber-400 mb-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                  </svg>
                  <p className="text-amber-400 font-medium">Mugifying...</p>
                  <p className="text-white/40 text-sm mt-1">
                    Adding {selectedMug?.name || "a mug"} to your photo
                  </p>
                </>
              ) : error ? (
                <p className="text-red-400 text-center px-8">{error}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        </div>

        {/* Vertical floor selector — right side, full height over dock */}
        {!captured && (
          <div className="fixed top-0 right-0 bottom-0 z-50 flex flex-col items-center justify-between gap-px px-1 bg-black/60 py-1 w-14">
            {[...FLOORS].reverse().map((floor) => (
              <button
                key={floor.number}
                onClick={() => selectFloor(floor.number)}
                className={`w-full flex-1 rounded-md text-base font-bold transition-all active:scale-90 flex items-center justify-center ${
                  selectedFloor === floor.number
                    ? "bg-amber-500 text-black"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {getFloorLabel(floor.number)}
              </button>
            ))}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="bg-black px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {!captured ? (
          <div className="flex flex-col items-center gap-3">
            {/* Mug selector strip */}
            {selectedFloor !== null && (
              <div className="w-full pr-14">
                {mugLocked && selectedMug ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-3 py-1">
                      {selectedMug.image_url ? (
                        <img src={selectedMug.image_url} alt={selectedMug.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <span className="text-sm">{selectedMug.avatar_emoji}</span>
                      )}
                      <span className="text-amber-400 text-sm font-medium">{selectedMug.name}</span>
                      <button
                        onClick={unlockMug}
                        className="text-white/40 hover:text-white/80 ml-1"
                        title="Change mug"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                    {floorMugs.length > 0 ? (
                      floorMugs.map((mug) => (
                        <button
                          key={mug.id}
                          onClick={() => setSelectedMug(mug)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all active:scale-95 ${
                            selectedMug?.id === mug.id
                              ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                              : "bg-white/5 border border-white/10 text-white/50"
                          }`}
                        >
                          {mug.image_url ? (
                            <img src={mug.image_url} alt={mug.name} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <span>{mug.avatar_emoji}</span>
                          )}
                          {mug.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-white/30 text-xs">Select a floor to see mugs</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shutter button with selected mug avatar */}
            <div className="relative">
              {selectedMug && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  {selectedMug.image_url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/30">
                      <img src={selectedMug.image_url} alt={selectedMug.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-lg shadow-lg">
                      {selectedMug.avatar_emoji}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={capturePhoto}
                disabled={!stream || !selectedMug || selectedFloor === null}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>
            </div>
          </div>
        ) : mugifiedImage ? (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium active:scale-95"
            >
              Retake
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-semibold active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
            <button
              onClick={handleShare}
              className="py-3 px-4 rounded-xl bg-white/10 text-white font-medium active:scale-95"
            >
              Share
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium active:scale-95"
            >
              Retake
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
