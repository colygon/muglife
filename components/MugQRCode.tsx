"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  mugId: number;
  mugName: string;
}

export default function MugQRCode({ mugId, mugName }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mugUrl = `https://muglife-alpha.vercel.app/mug/${mugId}`;

  useEffect(() => {
    QRCode.toDataURL(mugUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#1a1107", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl);
  }, [mugUrl]);

  function handleDownload() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `muglife-${mugName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  }

  if (!qrDataUrl) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-amber-200">QR Code</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFullscreen(true)}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-sm font-medium hover:bg-white/10 transition-colors active:scale-95"
          >
            Expand
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors active:scale-95"
          >
            Download
          </button>
        </div>
      </div>

      {/* Inline QR */}
      <div className="flex justify-center">
        <div
          className="bg-white rounded-2xl p-4 cursor-pointer active:scale-95 transition-transform"
          onClick={() => setShowFullscreen(true)}
        >
          <img src={qrDataUrl} alt={`QR code for ${mugName}`} className="w-40 h-40" />
          <p className="text-center text-[10px] text-gray-500 mt-2 font-mono">
            {mugName}
          </p>
        </div>
      </div>

      {/* Fullscreen overlay for scanning */}
      {showFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8"
          onClick={() => setShowFullscreen(false)}
        >
          <img src={qrDataUrl} alt={`QR code for ${mugName}`} className="w-72 h-72 mb-6" />
          <p className="text-2xl font-bold text-gray-900 mb-1">{mugName}</p>
          <p className="text-sm text-gray-500 font-mono mb-8">{mugUrl}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="px-6 py-3 rounded-xl bg-amber-500 text-black font-semibold active:scale-95"
          >
            Download QR Code
          </button>
          <p className="text-xs text-gray-400 mt-4">Tap anywhere to close</p>
        </div>
      )}
    </>
  );
}
