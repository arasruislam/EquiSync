"use client";

import React from "react";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { cn } from "@/lib/utils";

export function GlobalLoader() {
  const { isInitialLoading } = useGlobalLoading();

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex items-center justify-center bg-[#050B18] transition-all duration-700 ease-in-out pointer-events-none",
        isInitialLoading ? "opacity-100" : "opacity-0 invisible"
      )}
    >
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 -z-10 bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        
        {/* QuoteXStudio Branding Animation */}
        <div className="relative">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white select-none">
            <span className="relative inline-block animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-blue-600 bg-[length:200%_auto]">
              QuoteXStudio
            </span>
          </h1>
          
          {/* Decorative Elements */}
          <div className="absolute -bottom-4 left-0 right-0 h-[2px] overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-loading-bar" />
          </div>
        </div>

        {/* Status Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80 animate-pulse">
            Initializing Matrix
          </p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-blue-500/40 animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
