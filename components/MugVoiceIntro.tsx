"use client";

import { useState, useRef } from "react";

interface Props {
  mugId: number;
  mugName: string;
}

export default function MugVoiceIntro({ mugId, mugName }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function togglePlay() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/mug-voice?id=${mugId}`);
      if (!res.ok) throw new Error("Voice failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setPlaying(false);
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };

      audioRef.current = audio;
      setPlaying(true);
      setLoading(false);
      await audio.play();
    } catch {
      setLoading(false);
      setPlaying(false);
    }
  }

  return (
    <button
      onClick={togglePlay}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
        playing
          ? "bg-amber-500 text-black"
          : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
      }`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
        </svg>
      ) : playing ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
      {loading ? "Loading..." : playing ? "Playing..." : `Hear ${mugName}`}
    </button>
  );
}
