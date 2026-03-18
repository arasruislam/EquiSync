"use client";

import React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>System Critical - QuoteXStudio</title>
      </head>
      <body className="bg-[#050B18] min-h-screen flex items-center justify-center p-6 antialiased selection:bg-rose-500/30 selection:text-rose-200">
        <div className="max-w-xl w-full bg-[#0a0f1d] border border-white/5 rounded-[48px] p-10 md:p-14 text-center shadow-[0_32px_120px_-20px_rgba(225,29,72,0.15)] relative overflow-hidden group">
          {/* Crimson Signal / Fault Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-600/10 blur-[100px] rounded-full" />
          
          <div className="flex flex-col items-center gap-10">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-600/20 blur-2xl animate-pulse rounded-full" />
              <div className="relative w-24 h-24 bg-[#050B18] border border-rose-600/30 rounded-3xl flex items-center justify-center transition-transform hover:scale-105 duration-500">
                <AlertTriangle className="w-12 h-12 text-rose-600" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                Critical <span className="text-rose-600">Runtime</span> Failure
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                The core application layout has encountered a structural exception. 
                Full system recovery is required to restore secure operations.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
               <button
                onClick={() => reset()}
                className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-3 group shadow-xl shadow-rose-900/40 active:scale-[0.98] uppercase tracking-widest"
              >
                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                Initialize System Recovery
              </button>
              
              <a 
                href="/dashboard"
                className="w-full py-5 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest active:scale-[0.98]"
              >
                <Home className="w-5 h-5 text-blue-500" />
                Return to Neutral
              </a>
            </div>

            <div className="pt-10 border-t border-white/5 w-full space-y-3">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-700">
                Structural Integrity Breach Detected
              </p>
              <div className="bg-black/40 rounded-xl p-3 border border-white/5 mx-auto max-w-xs">
                <p className="text-[9px] font-mono text-rose-500/80 truncate w-full">
                  HASH: {error.digest || "UNIDENTIFIED_LOGIC_FAULT"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
