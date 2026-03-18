"use client";

import React from "react";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

export function MainContentLoader() {
  const { isContentLoading } = useGlobalLoading();

  return (
    <div
      className={cn(
        "absolute inset-0 z-[40] flex items-center justify-center bg-[#050B18]/40 backdrop-blur-[2px] transition-all duration-500 ease-in-out pointer-events-auto",
        isContentLoading ? "opacity-100" : "opacity-0 pointer-events-none invisible"
      )}
    >
      <div className="relative flex flex-col items-center gap-4 py-12 px-16 rounded-[40px] border border-white/5 bg-[#050B18]/80 shadow-2xl">
        {/* Subtle Pulse Rings */}
        <div className="absolute inset-0 -z-10 bg-blue-500/5 blur-3xl rounded-full animate-pulse" />
        
        <div className="relative flex items-center justify-center">
          <h2 className="text-xl font-black tracking-tighter text-white select-none italic">
            <span className="relative inline-block animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-blue-600 bg-[length:200%_auto]">
              QuoteXStudio
            </span>
          </h2>
        </div>
        
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500/60">
            Syncing Matrix
          </p>
          <div className="h-0.5 w-12 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-1/2 bg-blue-500 animate-loading-bar-fast" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes loading-bar-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
        .animate-loading-bar-fast {
          animation: loading-bar-fast 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
