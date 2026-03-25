"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Mug } from "@/lib/types";

export default function SelfiePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mugs, setMugs] = useState<(Mug & { current_floor: number | null })[]>([]);
  const [selectedMug, setSelectedMug] = useState<Mug | null>(null);
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
        if (data.length > 0) {
          // Pick a random mug
          setSelectedMug(data[Math.floor(Math.random() * data.length)]);
        }
      })
      .catch(() => {});
  }, []);

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
    // Mirror the image (front camera)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);

    // Stop camera
    stream?.getTracks().forEach((t) => t.stop());

    // Auto-mugify
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

  function handleDownload() {
    if (!mugifiedImage) return;
    const link = document.createElement("a");
    link.download = `muglife-selfie-${Date.now()}.png`;
    link.href = mugifiedImage;
    link.click();
  }

  function handleShare() {
    if (!mugifiedImage || !navigator.share) return;
    fetch(mugifiedImage)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], "muglife-selfie.png", { type: "image/png" });
        navigator.share({ files: [file], title: "My MugLife Selfie!" }).catch(() => {});
      });
  }

  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-sans)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
        <Link href="/app" className="text-white/60 text-sm">
          &larr; Back
        </Link>
        <span className="text-amber-400 font-bold">MugLife Selfie</span>
        <div className="w-12" />
      </div>

      {/* Mug selector */}
      {!captured && mugs.length > 0 && (
        <div className="px-4 py-2 bg-black/60">
          <p className="text-xs text-white/40 mb-2">Mug to add to your photo:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mugs.map((mug) => (
              <button
                key={mug.id}
                onClick={() => setSelectedMug(mug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${
                  selectedMug?.id === mug.id
                    ? "bg-amber-500 text-black font-bold"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {mug.image_url ? (
                  <img src={mug.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span>{mug.avatar_emoji}</span>
                )}
                {mug.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera / Result */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
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
              disabled={!stream || !selectedMug}
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
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-semibold active:scale-95"
            >
              Download
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
