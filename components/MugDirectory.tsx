"use client";

import { useState } from "react";
import Link from "next/link";
import { Mug } from "@/lib/types";
import AddMugForm from "@/components/AddMugForm";

interface MugWithStatus extends Mug {
  current_floor: number | null;
  total_scans: number;
}

interface Props {
  mugs: MugWithStatus[];
  onMugCreated?: () => void;
}

export default function MugDirectory({ mugs, onMugCreated }: Props) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = mugs.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.personality.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mugs..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 text-base"
        />
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors active:scale-95 text-sm whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      {/* Add Mug Form */}
      {showAddForm && (
        <AddMugForm
          onClose={() => setShowAddForm(false)}
          onMugCreated={() => {
            setShowAddForm(false);
            onMugCreated?.();
          }}
        />
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/40">No mugs found for &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((mug) => {
            const isHome =
              mug.current_floor !== null && mug.current_floor === mug.home_floor;
            return (
              <Link
                key={mug.id}
                href={`/mug/${mug.id}`}
                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-colors active:scale-[0.97] flex flex-col items-center text-center"
              >
                {mug.image_url ? (
                  <img
                    src={mug.image_url}
                    alt={mug.name}
                    className="w-16 h-16 rounded-xl object-cover mb-2"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-amber-500/10 flex items-center justify-center text-3xl mb-2">
                    {mug.avatar_emoji}
                  </div>
                )}
                <h3 className="font-semibold text-amber-400 text-sm truncate w-full">
                  {mug.name}
                </h3>
                <p className="text-[11px] text-white/40 truncate w-full">
                  {mug.personality}
                </p>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                    Floor {mug.home_floor}
                  </span>
                  {mug.current_floor !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isHome
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {isHome ? "home" : `on ${mug.current_floor}`}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
