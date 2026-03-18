"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home, LogIn } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for technical analysis
    console.error("System Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Ambience / Fault Signal */}
      <div className="absolute inset-0 -z-10 bg-rose-900/10 blur-[150px] rounded-full scale-150 animate-pulse" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/5 blur-[120px] rounded-full animate-pulse" />

      <div className="relative max-w-2xl w-full flex flex-col items-center gap-8">
        {/* Error Icon & Branding Overlay */}
        <div className="relative group">
          <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-150 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative w-24 h-24 bg-[#0a0f1d] border border-rose-500/30 rounded-[32px] flex items-center justify-center shadow-2xl transition-all group-hover:border-rose-500/50">
            <AlertCircle className="w-12 h-12 text-rose-500 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            System <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-8">Fault</span> Detected
          </h1>
          <p className="text-gray-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
            An unexpected runtime exception has occurred. The system is attempting to remain stable.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-900/20 active:scale-95 group"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Attempt Recovery
          </button>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#141414] hover:bg-[#1c1c1c] border border-white/10 text-gray-300 rounded-2xl font-bold transition-all active:scale-95"
          >
            <Home className="w-5 h-5 text-blue-500" />
            Return to Neutral
          </Link>
        </div>

        {/* System Digest Console */}
        <div className="mt-8 p-6 bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl w-full text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
            <span className="text-[10px] font-black text-rose-500 font-mono tracking-widest uppercase">System Digest</span>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Error Signature</p>
              <code className="text-xs text-rose-400 font-mono break-all line-clamp-2">
                {error.message || "Unknown Structural Logic Error"}
              </code>
            </div>
            {error.digest && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Runtime Digest</p>
                <code className="text-[10px] text-gray-500 font-mono">{error.digest}</code>
              </div>
            )}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-[10px] text-gray-700 italic">Reference: QuoteXStudio_OS_v0.1.0_ERR</p>
              <Link href="/login" className="text-[10px] font-bold text-blue-500 hover:underline underline-offset-4 flex items-center gap-1">
                Security Halt (Logout) <LogIn className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Branded Animation */}
        <div className="mt-8 flex flex-col items-center gap-4 opacity-50">
          <div className="h-[1px] w-24 bg-white/5 rounded-full overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-shimmer" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
            QuoteXStudio Internal Management
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
    </div>
  );
}
