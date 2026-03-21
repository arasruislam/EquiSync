"use client";

import React from "react";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { cn } from "@/lib/utils";

export function MainContentLoader() {
  const { isContentLoading } = useGlobalLoading();

  return (
    <div
      className={cn(
        "absolute inset-0 z-[40] flex items-center justify-center bg-[#050B18]/60 backdrop-blur-md transition-content pointer-events-auto",
        isContentLoading 
          ? "opacity-100 scale-100 translate-y-0" 
          : "opacity-0 scale-[0.98] translate-y-4 pointer-events-none invisible"
      )}
    >
      <div className="relative flex flex-col items-center gap-6 py-10 px-14 rounded-[32px] border border-white/10 bg-[#0A101F]/90 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Intrinsic Card Glow */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-blue-500/5 blur-2xl rounded-full animate-pulse-slow" />
        
        <div className="relative flex flex-col items-center gap-2">
          <h2 className="text-2xl font-black tracking-tighter text-white select-none italic">
            <span className="relative inline-block animate-shimmer-fast bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-blue-600 bg-[length:200%_auto]">
              QuoteXStudio
            </span>
          </h2>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent rotate-1" />
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-500/70 animate-pulse">
              Syncing Neural Matrix
            </p>
            <div className="h-[1.5px] w-16 overflow-hidden rounded-full bg-white/5 backdrop-blur-sm">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-loading-slide" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer-fast {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes loading-slide {
          0% { transform: translateX(-150%) scaleX(0.5); }
          50% { transform: translateX(0%) scaleX(1.2); }
          100% { transform: translateX(150%) scaleX(0.5); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .transition-content {
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-shimmer-fast {
          animation: shimmer-fast 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-loading-slide {
          animation: loading-slide 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
