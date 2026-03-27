"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  const preselectedMugId = searchParams.get("mug");
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
            setSelectedFloor(preselected.current_floor ?? preselected.home_floor);
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedMugId]);

  // When floor changes, pick a mug on that floor
  function selectFloor(floor: number) {
    setSelectedFloor(floor);
    // Prefer a mug currently checked in to this floor, fallback to home floor
    const onFloor = mugs.filter((m) => m.current_floor === floor);
    const homesHere = mugs.filter((m) => m.home_floor === floor);
    const candidate = onFloor[0] || homesHere[0] || mugs[Math.floor(Math.random() * mugs.length)];
    setSelectedMug(candidate || null);
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
      await fetch(`/api/mug/${selectedMug.id}/selfie`, { method: "POST", body: fd });

      // Also download to device
      const link = document.createElement("a");
      link.download = `muglife-${selectedMug.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.png`;
      link.href = mugifiedImage;
      link.click();

      setSaved(true);
    } catch {
      // Still download even if upload fails
      const link = document.createElement("a");
      link.download = `muglife-selfie-${Date.now()}.png`;
      link.href = mugifiedImage;
      link.click();
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

      {/* Floor selector */}
      {!captured && (
        <div className="px-4 py-2 bg-black/80 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-white/40">What floor are you on?</p>
            {selectedMug && (
              <span className="text-xs text-amber-400">
                with {selectedMug.name}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Top row: B through 8 */}
            <div className="flex gap-1.5 justify-center">
              {FLOORS.filter((f) => f.number <= 8).map((floor) => (
                <button
                  key={floor.number}
                  onClick={() => selectFloor(floor.number)}
                  className={`flex-shrink-0 w-10 h-10 rounded-lg font-bold text-sm transition-all active:scale-90 ${
                    selectedFloor === floor.number
                      ? "bg-amber-500 text-black"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {getFloorLabel(floor.number)}
                </button>
              ))}
            </div>
            {/* Bottom row: 9 through R */}
            <div className="flex gap-1.5 justify-center">
              {FLOORS.filter((f) => f.number >= 9).map((floor) => (
                <button
                  key={floor.number}
                  onClick={() => selectFloor(floor.number)}
                  className={`flex-shrink-0 w-10 h-10 rounded-lg font-bold text-sm transition-all active:scale-90 ${
                    selectedFloor === floor.number
                      ? "bg-amber-500 text-black"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {getFloorLabel(floor.number)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Camera / Result */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center bg-black overflow-hidden">
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

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="bg-black px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {!captured ? (
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={!stream || !selectedMug || selectedFloor === null}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
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
