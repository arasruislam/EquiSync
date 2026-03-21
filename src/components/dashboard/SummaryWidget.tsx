"use client";

import { LucideIcon } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import React from "react";

interface SummaryWidgetProps {
  label: string;
  value?: number; // Legacy amountUSD
  amountBDT?: number;
  amountUSD?: number;
  icon: LucideIcon;
  themeColor: "blue" | "red" | "amber" | "emerald";
  description?: string;
  exchangeRate?: number;
}

const themeConfigs = {
  emerald: {
    color: "text-emerald-600 dark:text-emerald-400",
    accent: "#10b981",
    bg: "bg-emerald-50 dark:bg-emerald-400/5",
    glow: "rgba(16, 185, 129, 0.4)",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
  red: {
    color: "text-rose-600 dark:text-[#ef4444]",
    accent: "#ef4444",
    bg: "bg-rose-50 dark:bg-[#ef4444]/5",
    glow: "rgba(239, 68, 68, 0.4)",
    border: "border-rose-200 dark:border-[#ef4444]/20",
  },
  amber: {
    color: "text-amber-600 dark:text-amber-400",
    accent: "#f59e0b",
    bg: "bg-amber-50 dark:bg-amber-400/5",
    glow: "rgba(245, 158, 11, 0.4)",
    border: "border-amber-200 dark:border-amber-500/20",
  },
  blue: {
    color: "text-blue-600 dark:text-blue-400",
    accent: "#3b82f6",
    bg: "bg-blue-50 dark:bg-blue-400/5",
    glow: "rgba(59, 130, 246, 0.4)",
    border: "border-blue-200 dark:border-blue-500/20",
  },
};

export function SummaryWidget({
  label,
  value,
  amountBDT,
  amountUSD,
  icon: Icon,
  themeColor,
  description,
  exchangeRate = 120,
}: SummaryWidgetProps) {
  const theme = themeConfigs[themeColor];

  return (
    <div
      className={cn(
        "group relative p-6 rounded-3xl transition-all duration-700 cursor-default flex flex-col justify-between overflow-hidden",
        "bg-white dark:bg-[#050B18] backdrop-blur-xl border border-slate-100 dark:border-white/10 hover:border-slate-200 dark:hover:border-white/20 shadow-md dark:shadow-2xl dark:shadow-black/20"
      )}
    >
      {/* Accent Glow Background */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 transition-opacity duration-700 opacity-20 group-hover:opacity-40"
        style={{ backgroundColor: theme.accent }}
      />

      <div className="flex items-center justify-between relative z-10 mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
          theme.bg,
          theme.color,
          "border border-slate-100 dark:border-white/5 backdrop-blur-sm"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1 group-hover:text-slate-600 dark:group-hover:text-gray-400 transition-colors">
            {label}
          </span>
          {description && (
            <span className="text-[8px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-tight">
              {description}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-1">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex flex-col">
          <span className={cn("transition-colors duration-500 group-hover:text-slate-900 dark:group-hover:text-white", theme.color)}>
            {formatCurrency(amountBDT !== undefined ? amountBDT : (value || amountUSD || 0) * exchangeRate, "BDT")}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-gray-400 font-bold opacity-70 mt-0.5">
            ({formatCurrency(amountUSD !== undefined ? amountUSD : (value || (amountBDT ? amountBDT / exchangeRate : 0)), "USD")})
          </span>
        </h3>
      </div>

      {/* Interactive Bottom Accent */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-transparent via-[var(--accent-glow)] to-transparent group-hover:w-full transition-all duration-1000 ease-out z-20"
        style={{ "--accent-glow": theme.accent } as React.CSSProperties}
      />
    </div>
  );
}
