"use client";

import { useState } from "react";
import Link from "next/link";
import { Selfie } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface Props {
  selfies: Selfie[];
  mugId: number;
  mugName: string;
  onSelfieAdded: () => void;
}

// Flip an image file horizontally (for front camera selfies)
function flipImageHorizontally(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function SelfieGallery({
  selfies,
  mugId,
  mugName,
  onSelfieAdded,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [mugifying, setMugifying] = useState(false);
  const [mugifiedImage, setMugifiedImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  async function handleCapture() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      input.capture = "user";
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Mugify the selfie with AI — only the mugified version gets saved (on Save)
      setUploading(false);
      setMugifying(true);
      try {
        const flippedBlob = await flipImageHorizontally(file);
        const mugifyData = new FormData();
        mugifyData.append("image", flippedBlob, "selfie.jpg");
        const mugifyRes = await fetch(`/api/mug/${mugId}/mugify`, {
          method: "POST",
          body: mugifyData,
        });
        if (mugifyRes.ok) {
          const data = await mugifyRes.json();
          if (data.image) {
            setMugifiedImage(data.image);
          }
        } else {
          console.error("Mugify failed:", await mugifyRes.text());
        }
      } catch (err) {
        console.error("Mugify error:", err);
      }
      setMugifying(false);
    };

    input.click();
  }

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveMugified() {
    if (!mugifiedImage) return;
    setSaving(true);
    try {
      const res = await fetch(mugifiedImage);
      const blob = await res.blob();
      const author =
        typeof window !== "undefined"
          ? localStorage.getItem("muglife-name") || "Anonymous"
          : "Anonymous";
      const fd = new FormData();
      fd.append("image", blob, "mugified-selfie.png");
      fd.append("author", author);
      const uploadRes = await fetch(`/api/mug/${mugId}/selfie`, {
        method: "POST",
        body: fd,
      });
      if (uploadRes.ok) {
        onSelfieAdded();
        setSaved(true);
      }
    } catch {
      // Still download even if upload fails
    }
    // Also download to device
    const link = document.createElement("a");
    link.download = `muglife-${mugName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-mugified.png`;
    link.href = mugifiedImage;
    link.click();
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-amber-200">
          Selfies with {mugName}
        </h2>
        <Link
          href={`/app/selfie?mug=${mugId}`}
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors active:scale-95"
        >
          📸 Take Selfie
        </Link>
      </div>

      {/* Mugifying indicator */}
      {mugifying && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg
              className="w-5 h-5 animate-spin text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
            <span className="text-amber-400 font-medium text-sm">
              Mugifying your selfie...
            </span>
          </div>
          <p className="text-xs text-white/40">
            AI is replacing your mug with {mugName}&apos;s character!
          </p>
        </div>
      )}

      {/* Mugified result */}
      {mugifiedImage && (
        <div className="mb-4 rounded-xl overflow-hidden border-2 border-amber-500/30">
          <div className="relative">
            <img
              src={mugifiedImage}
              alt={`Mugified selfie with ${mugName}`}
              className="w-full"
            />
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-amber-500 text-black text-xs font-bold">
              MUGIFIED
            </div>
          </div>
          <div className="bg-[#1a1107] p-3 flex gap-2">
            <button
              onClick={() => { setMugifiedImage(null); setSaved(false); }}
              className="flex-1 py-2 rounded-lg bg-white/10 text-white font-medium text-sm active:scale-95"
            >
              Retake
            </button>
            <button
              onClick={handleSaveMugified}
              disabled={saving || saved}
              className="flex-1 py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  fetch(mugifiedImage)
                    .then((r) => r.blob())
                    .then((blob) => {
                      const file = new File([blob], "mugified.png", {
                        type: "image/png",
                      });
                      navigator.share({ files: [file] }).catch(() => {});
                    });
                }
              }}
              className="flex-1 py-2 rounded-lg bg-white/10 text-white font-medium text-sm active:scale-95"
            >
              Share
            </button>
          </div>
        </div>
      )}

      {selfies.length === 0 && !mugifiedImage ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">📷</div>
          <p className="text-white/40 text-sm">
            No selfies yet! Take one and watch {mugName} come to life!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {selfies.map((selfie) => (
            <button
              key={selfie.id}
              onClick={() => setViewingImage(selfie.image_url)}
              className="aspect-square rounded-xl overflow-hidden bg-white/5 relative group"
            >
              <img
                src={selfie.image_url}
                alt={`Selfie with ${mugName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white/80 truncate">
                  {selfie.author}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

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
            alt={`Selfie with ${mugName}`}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
