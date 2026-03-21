"use client";

import { LucideIcon } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import React from "react";

interface SummaryCardProps {
  label: string;
  value: number;
  secondaryValue?: number;
  exchangeRate?: number;
  icon: LucideIcon;
  color: string; // Tailwind text color class, e.g. "text-emerald-400"
  accentColor: string; // Hex color for the hover border/glow
  bg: string; // Tailwind bg color class with opacity, e.g. "bg-emerald-400/10"
  description?: string;
  isCurrency?: boolean;
}

export function SummaryCard({
  label,
  value,
  secondaryValue,
  exchangeRate = 120,
  icon: Icon,
  color,
  accentColor,
  bg,
  description,
  isCurrency = true,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "group p-6 bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-2xl transition-all duration-500 cursor-default flex flex-col justify-between shadow-md dark:shadow-lg dark:shadow-blue-900/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] border-transparent",
        "relative overflow-hidden"
      )}
      style={{
        "--hover-accent": accentColor,
      } as React.CSSProperties}
    >
      {/* Dynamic Hover Border (Animated) */}
      <div 
        className="absolute inset-0 border border-transparent group-hover:border-[var(--hover-accent)] rounded-2xl transition-all duration-700 pointer-events-none z-20 opacity-0 group-hover:opacity-40"
        style={{
          boxShadow: "inset 0 0 15px -5px var(--hover-accent), 0 0 15px -5px var(--hover-accent)"
        }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className={cn("p-2 rounded-xl transition-all duration-500 group-hover:scale-110", bg, color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 text-center relative z-10">
        <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-2 group-hover:text-slate-500 dark:group-hover:text-gray-400 transition-colors">
          {label}
        </p>
        <h3 className={cn("text-2xl font-black text-slate-900 dark:text-white transition-colors duration-500")}>
          <div className="flex flex-col items-center">
            <span className="group-hover:text-[var(--hover-accent)] transition-colors duration-500">
              {isCurrency ? formatCurrency(value * exchangeRate, "BDT") : value}
            </span>
            {isCurrency && (
              <span className="text-xs text-slate-400 dark:text-gray-600 font-bold opacity-80 mt-1 group-hover:opacity-100 transition-opacity">
                ({formatCurrency(value, "USD")})
              </span>
            )}
          </div>
        </h3>
        {description && (
          <p className="text-[9px] text-slate-400 dark:text-gray-700 mt-3 font-bold uppercase tracking-tight group-hover:text-slate-600 dark:group-hover:text-gray-500 transition-colors">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
