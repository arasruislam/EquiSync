"use client";

import React from "react";
import { Search, Home, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden antialiased">
      {/* Background Dimensional Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[160px] rounded-full" />
      <div className="absolute -top-24 right-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full animate-pulse" />
      
      <div className="relative flex flex-col items-center gap-14 max-w-lg">
        {/* Massive 404 Visual Identity */}
        <div className="relative flex flex-col items-center">
          <h1 className="text-[180px] md:text-[240px] font-black leading-none tracking-tighter text-white opacity-[0.03] select-none font-mono">
            404
          </h1>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
            <div className="space-y-4">
               <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase italic relative">
                Request <br/> <span className="text-blue-500 underline decoration-blue-500/20 underline-offset-8">Nullified</span>
              </h2>
              <div className="h-1 w-24 bg-blue-600/40 rounded-full mx-auto" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed">
            The target node you are attempting to reach does not exist within the QuoteXStudio matrix.
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60 bg-blue-500/5 border border-blue-500/10 py-2.5 px-6 rounded-full mx-auto w-fit shadow-xl shadow-blue-900/5">
            <Search className="w-3 h-3 animate-bounce" /> System Lookup Failed
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-900/30 active:scale-95 uppercase tracking-widest text-xs"
          >
            <Home className="w-5 h-5" />
            Home Base
          </Link>
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[#141414] hover:bg-[#1c1c1c] border border-white/10 text-gray-400 rounded-2xl font-black transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
            Return Back
          </button>
        </div>

        {/* System Matrix Footer */}
        <div className="mt-12 font-mono text-[9px] text-gray-700 tracking-[0.4em] flex items-center gap-8 opacity-40 uppercase font-black">
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> SECURE</span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-blue-500 rounded-full" /> STABLE</span>
          <span>QuoteXStudio_OS</span>
        </div>
      </div>
    </div>
  );
}
