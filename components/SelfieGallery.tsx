"use client";

import { useState } from "react";
import { Selfie } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface Props {
  selfies: Selfie[];
  mugId: number;
  mugName: string;
  onSelfieAdded: () => void;
}

export default function SelfieGallery({
  selfies,
  mugId,
  mugName,
  onSelfieAdded,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  async function handleCapture() {
    // Create a file input — use camera on mobile, file picker on desktop
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    // Only set capture on mobile (it blocks file picker on desktop)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      input.capture = "user"; // Front camera for selfies
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const author =
          typeof window !== "undefined"
            ? localStorage.getItem("muglife-name") || "Anonymous"
            : "Anonymous";

        const formData = new FormData();
        formData.append("image", file);
        formData.append("author", author);

        const res = await fetch(`/api/mug/${mugId}/selfie`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          onSelfieAdded();
        }
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    };

    input.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-amber-200">
          Selfies with {mugName}
        </h2>
        <button
          onClick={handleCapture}
          disabled={uploading}
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors active:scale-95 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "📸 Take Selfie"}
        </button>
      </div>

      {selfies.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">📷</div>
          <p className="text-white/40 text-sm">
            No selfies yet! Be the first to take one with {mugName}.
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
