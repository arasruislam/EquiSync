"use client";

import React from "react";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { cn } from "@/lib/utils";

export function GlobalLoader() {
  const { isInitialLoading } = useGlobalLoading();

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex items-center justify-center bg-[#050B18] transition-premium pointer-events-none",
        isInitialLoading 
          ? "opacity-100 scale-100 blur-0" 
          : "opacity-0 scale-110 blur-xl invisible"
      )}
    >
      <div className="relative flex flex-col items-center gap-10">
        {/* Multi-Layered Cinematic Glow */}
        <div className="absolute inset-0 -z-10 bg-blue-600/10 blur-[150px] rounded-full animate-glow-slow" />
        <div className="absolute inset-x-[-50%] top-[-50%] bottom-[-50%] -z-10 bg-gradient-to-tr from-blue-600/5 via-transparent to-purple-600/5 blur-[100px] animate-pulse-slow" />
        
        {/* QuoteXStudio Branding Animation - Luxurious Liquid Fill */}
        <div className="relative group">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter select-none relative z-10">
            <span className="relative inline-block animate-liquid-fill bg-clip-text text-transparent bg-gradient-to-b from-white/10 via-blue-500 to-purple-600 bg-[length:100%_400%] filter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              QuoteXStudio
            </span>
          </h1>
          
          {/* Refined Loading Progress Indicator */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-[1px] overflow-hidden rounded-full bg-white/5 backdrop-blur-sm">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-loading-flow" />
          </div>
        </div>

        {/* Neural Sync Status */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-2xl">
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-blue-500/90 ml-1">
              Establishing Node Connection
            </p>
          </div>
          
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-b from-blue-500/60 to-blue-600/20 animate-stagger-float"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes liquid-fill {
          0% { background-position: 0% 100%; opacity: 0.8; }
          50% { background-position: 0% 50%; opacity: 1; }
          100% { background-position: 0% 0%; opacity: 0.8; }
        }
        @keyframes loading-flow {
          0% { transform: translateX(-150%) scaleX(0.5); }
          50% { transform: translateX(0%) scaleX(1); }
          100% { transform: translateX(150%) scaleX(0.5); }
        }
        @keyframes glow-slow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: rotate(0deg); }
          50% { opacity: 0.3; transform: rotate(5deg) scale(1.1); }
        }
        @keyframes stagger-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-8px) scale(1.2); opacity: 1; }
        }
        .transition-premium {
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-liquid-fill {
          animation: liquid-fill 5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .animate-loading-flow {
          animation: loading-flow 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .animate-glow-slow {
          animation: glow-slow 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-stagger-float {
          animation: stagger-float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
