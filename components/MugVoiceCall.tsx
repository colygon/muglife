"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Vapi from "@vapi-ai/web";

interface Props {
  mugId: number;
  mugName: string;
  mugEmoji: string;
}

type CallState = "idle" | "connecting" | "active" | "ended";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!;

export default function MugVoiceCall({ mugId, mugName, mugEmoji }: Props) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, []);

  const startCall = useCallback(async () => {
    setError(null);
    setCallState("connecting");

    try {
      // Fetch mug voice config from our API
      const res = await fetch(`/api/mug/${mugId}/voice-config`);
      if (!res.ok) throw new Error("Failed to load voice config");
      const config = await res.json();

      // Initialize Vapi
      const vapi = new Vapi(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on("call-start", () => setCallState("active"));
      vapi.on("call-end", () => {
        setCallState("idle");
        vapiRef.current = null;
      });
      vapi.on("error", (e) => {
        console.error("Vapi error:", e);
        setError("Call failed. Try again.");
        setCallState("idle");
        vapiRef.current = null;
      });

      // Start call with transient assistant config
      await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: config.systemPrompt },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: config.voiceId || "EXAVITQu4vr4xnSDxMaL",
        },
        firstMessage: config.firstMessage,
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      setError("Couldn't connect. Try again.");
      setCallState("idle");
      vapiRef.current = null;
    }
  }, [mugId]);

  const endCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    setCallState("idle");
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      {callState === "idle" && (
        <button
          onClick={startCall}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          Talk to {mugName}
        </button>
      )}

      {callState === "connecting" && (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20"
        >
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
          </svg>
          Connecting...
        </button>
      )}

      {callState === "active" && (
        <button
          onClick={endCall}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 bg-red-500 text-white animate-pulse"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
          </svg>
          End Call
        </button>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
