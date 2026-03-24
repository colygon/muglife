"use client";

import { useState } from "react";
import { FLOORS } from "@/lib/floors";

interface Props {
  onMugCreated: () => void;
  onClose: () => void;
}

export default function AddMugForm({ onMugCreated, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [homeFloor, setHomeFloor] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !homeFloor) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/mug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          home_floor: homeFloor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create mug");
      }

      onMugCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#1a1107] border-t border-amber-500/20 rounded-t-2xl p-6 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-bold text-amber-400 text-center mb-1">
          Add a Mug
        </h2>
        <p className="text-sm text-white/40 text-center mb-6">
          Give your mug a name and personality. We&apos;ll generate its avatar!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-amber-200/80 mb-1.5">
              Mug Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Professor Brew, Chip, Bubbles..."
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 text-base"
            />
          </div>

          {/* Description / Personality */}
          <div>
            <label className="block text-sm font-medium text-amber-200/80 mb-1.5">
              Description & Personality
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. A stout red mug who loves marshmallows and tells dad jokes. Always warm, never bitter."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 text-base resize-none"
            />
            <p className="text-[11px] text-white/30 mt-1">
              This shapes the mug&apos;s look and chat personality.
            </p>
          </div>

          {/* Home Floor */}
          <div>
            <label className="block text-sm font-medium text-amber-200/80 mb-1.5">
              Home Floor
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FLOORS.map((floor) => (
                <button
                  key={floor.number}
                  type="button"
                  onClick={() => setHomeFloor(floor.number)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                    homeFloor === floor.number
                      ? "bg-amber-500 text-black"
                      : "bg-white/5 text-white/60 border border-white/10"
                  }`}
                >
                  <span className="block font-bold">
                    {floor.number === -1 ? "B" : floor.number}
                  </span>
                  <span className="block text-[10px] opacity-70 truncate">
                    {floor.shortName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || !homeFloor || creating}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors disabled:opacity-50 active:scale-[0.97]"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                </svg>
                Generating avatar...
              </span>
            ) : (
              "Create Mug"
            )}
          </button>

          {creating && (
            <p className="text-xs text-white/30 text-center">
              This takes ~15 seconds while we generate the character art.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
