"use client";

import { useState, useRef, FormEvent } from "react";

const MUGS = [
  {
    id: "deborah",
    name: "Deborah",
    floor: "Floor 9",
    vibe: "The Guilt-Tripper",
    quote:
      "I've been on Floor 12 for six days. Six days! Please take me home.",
    color: "from-pink-500/20 to-purple-500/20",
    borderColor: "border-pink-500/30",
  },
  {
    id: "gerald",
    name: "Gerald",
    floor: "Floor 15",
    vibe: "The Survivor",
    quote:
      "Someone left me in the makerspace for three weeks. I had things growing in me. But I survived.",
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "mug47",
    name: "Mug #47",
    floor: "Floor 2",
    vibe: "The Nomad",
    quote:
      "I've given up trying to get home. I just travel now. I'm a nomad. A ceramic nomad.",
    color: "from-blue-500/20 to-indigo-500/20",
    borderColor: "border-blue-500/30",
  },
];

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [playingMug, setPlayingMug] = useState<string | null>(null);
  const [loadingMug, setLoadingMug] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function playMugVoice(mugId: string) {
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking the same mug, just stop
    if (playingMug === mugId) {
      setPlayingMug(null);
      return;
    }

    setLoadingMug(mugId);
    try {
      const res = await fetch(`/api/mug-voice?mug=${mugId}`);
      if (!res.ok) throw new Error("Failed to load voice");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setPlayingMug(null);
        URL.revokeObjectURL(url);
      };

      audioRef.current = audio;
      setPlayingMug(mugId);
      setLoadingMug(null);
      await audio.play();
    } catch {
      setLoadingMug(null);
      setPlayingMug(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, telegram, suggestion }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      alert("Something went wrong. Try again!");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1107] text-white font-[family-name:var(--font-geist-sans)]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 sm:px-12 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-6xl sm:text-8xl mb-6 animate-bounce-slow">
            &#9749;
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
            <span className="text-amber-400">MugLife</span>
          </h1>
          <p className="text-xl sm:text-2xl text-amber-200/80 font-light mb-6">
            Your coffee mug has a story. Let it tell you.
          </p>
          <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            QR-coded mugs that know where they live, where they&apos;ve been,
            and how to guilt-trip you into bringing them home.
          </p>
          <a
            href="#signup"
            className="inline-block mt-8 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-base transition-colors"
          >
            Join the Waitlist
          </a>
        </div>
      </section>

      {/* The Problem */}
      <section className="px-6 py-16 sm:px-12 sm:py-24 bg-black/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-amber-300">
            The Great Mug Migration
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="text-4xl">&#128373;</div>
              <h3 className="font-semibold text-amber-200">They Vanish</h3>
              <p className="text-sm text-white/50">
                Floor 9 had 20 mugs. Now they have 1. Where did they go? Nobody
                knows.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl">&#128507;</div>
              <h3 className="font-semibold text-amber-200">They Wander</h3>
              <p className="text-sm text-white/50">
                Found: 14 mugs on Floor 12. None of them live there.
                They&apos;ve formed a colony.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl">&#129326;</div>
              <h3 className="font-semibold text-amber-200">They Rot</h3>
              <p className="text-sm text-white/50">
                Discovered in the makerspace sink with settled gunk. Had to be
                hand-washed before the dishwasher would accept them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 sm:px-12 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-amber-300">
            How MugLife Works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="font-semibold text-amber-200 text-lg">
                  Every mug gets a QR code
                </h3>
                <p className="text-white/50 mt-1">
                  Laser-engraved or stickered. Each mug gets a unique identity,
                  a name, a home floor, and a personality.
                </p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="font-semibold text-amber-200 text-lg">
                  Scan it, chat with it
                </h3>
                <p className="text-white/50 mt-1">
                  No app needed. Scan the QR, get a web page. The mug tells you
                  its name, where it lives, and how long it&apos;s been away
                  from home. Leave a note for the next person.
                </p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="font-semibold text-amber-200 text-lg">
                  Social pressure does the rest
                </h3>
                <p className="text-white/50 mt-1">
                  Floor leaderboards. Slack alerts. Mug rescue points.
                  &quot;Floor 12 is currently hoarding 14 mugs that don&apos;t
                  belong to them&quot; hits different.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 sm:px-12 sm:py-24 bg-black/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-amber-300">
            Each Mug Gets...
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: "\u{1F4AC}",
                title: "A Personality",
                desc: "\"I'm Deborah. I live on 9. I've been on 12 for 6 days. Please take me home.\"",
              },
              {
                icon: "\u{1F4CA}",
                title: "A Travel History",
                desc: "See everywhere the mug has been scanned. Some mugs are well-traveled.",
              },
              {
                icon: "\u{1F3C6}",
                title: "Rescue Points",
                desc: "Return a mug to its home floor and earn credit. Gamify the guilt.",
              },
              {
                icon: "\u{1F514}",
                title: "Slack Alerts",
                desc: "#mug-patrol: 3 mugs from Floor 9 spotted on Floor 2. Come get your kids.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-amber-200 mb-1">
                  {f.title}
                </h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Demo */}
      <section className="px-6 py-16 sm:px-12 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-amber-300">
            Hear Your Mug
          </h2>
          <p className="text-center text-white/50 mb-12">
            Every mug has a voice. Tap one to hear its story.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {MUGS.map((mug) => (
              <button
                key={mug.id}
                onClick={() => playMugVoice(mug.id)}
                className={`text-left p-5 rounded-xl bg-gradient-to-br ${mug.color} border ${
                  playingMug === mug.id
                    ? mug.borderColor
                    : "border-white/10"
                } hover:${mug.borderColor} transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">&#9749;</span>
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      playingMug === mug.id
                        ? "bg-amber-500 text-black"
                        : loadingMug === mug.id
                        ? "bg-white/10 text-white/50"
                        : "bg-white/10 text-white/50 group-hover:bg-amber-500/20 group-hover:text-amber-400"
                    }`}
                  >
                    {loadingMug === mug.id ? (
                      <svg
                        className="w-5 h-5 animate-spin"
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
                    ) : playingMug === mug.id ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-lg">
                  {mug.name}
                </h3>
                <p className="text-xs text-white/40 mb-2">
                  {mug.floor} &middot; {mug.vibe}
                </p>
                <p className="text-sm text-white/50 italic">
                  &ldquo;{mug.quote}&rdquo;
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section className="px-6 py-16 sm:px-12 sm:py-24" id="signup">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-amber-300">
            Want In?
          </h2>
          <p className="text-center text-white/50 mb-10">
            We&apos;re building this for the tower. Drop your info and tell us
            what features you&apos;d want. We&apos;ll keep you posted on
            Telegram.
          </p>

          {submitted ? (
            <div className="text-center py-12 px-6 rounded-2xl bg-white/5 border border-amber-500/30">
              <div className="text-5xl mb-4">&#9749;</div>
              <h3 className="text-xl font-semibold text-amber-200 mb-2">
                You&apos;re on the list!
              </h3>
              <p className="text-white/50">
                We&apos;ll reach out on Telegram when we&apos;re ready to deploy
                the first mugs. Your mug misses you already.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-amber-200/80 mb-1.5"
                >
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tom V"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-amber-200/80 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tom@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="telegram"
                  className="block text-sm font-medium text-amber-200/80 mb-1.5"
                >
                  Telegram Username{" "}
                  <span className="text-white/30">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                    @
                  </span>
                  <input
                    id="telegram"
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="username"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="suggestion"
                  className="block text-sm font-medium text-amber-200/80 mb-1.5"
                >
                  Ideas / Suggestions{" "}
                  <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  id="suggestion"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={3}
                  placeholder="Color-coded mugs per floor? NFC instead of QR? A mug that roasts you?"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Joining..." : "Join the Waitlist"}
              </button>

              <p className="text-xs text-center text-white/30">
                No spam. Just mug updates and good vibes.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/5 text-center text-xs text-white/25">
        MugLife &mdash; because mugs deserve to go home too.
      </footer>
    </div>
  );
}
