"use client";

import React from "react";
import { ArrowRight, Activity, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditTraceViewProps {
  oldValue: any;
  newValue: any;
  minimal?: boolean;
}

export function AuditTraceView({ oldValue, newValue, minimal = false }: AuditTraceViewProps) {
  const formatKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-400 dark:text-gray-700 italic">null</span>;
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    
    const lowerKey = key.toLowerCase();
    if (typeof value === "number" && (lowerKey.includes("amount") || lowerKey.includes("dues") || lowerKey.includes("invested") || lowerKey.includes("balance"))) {
      return lowerKey.includes("usd") ? `$${value.toFixed(2)}` : `৳${value.toLocaleString()}`;
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value).toLocaleDateString();
    }
    
    return String(value);
  };

  // Logic to extract fields and handle arrays (specifically 'contributions')
  const getDiffs = () => {
    const diffs: any[] = [];
    const metaKeys = ["_id", "__v", "updatedAt", "createdAt", "isDeleted", "actor", "id"];
    
    const allKeys = Array.from(new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {})
    ])).filter(key => !metaKeys.includes(key));

    allKeys.forEach(key => {
      const oldVal = oldValue?.[key];
      const newVal = newValue?.[key];

      if (key === "contributions" && (Array.isArray(oldVal) || Array.isArray(newVal))) {
        const maxLen = Math.max((oldVal || []).length, (newVal || []).length);
        for (let i = 0; i < maxLen; i++) {
          const oldSub = oldVal?.[i] || {};
          const newSub = newVal?.[i] || {};
          const subKeys = Array.from(new Set([...Object.keys(oldSub), ...Object.keys(newSub)]))
            .filter(k => !metaKeys.includes(k));

          subKeys.forEach(subK => {
            diffs.push({
              label: `Contribution [${i}] - ${formatKey(subK)}`,
              old: oldSub[subK],
              new: newSub[subK],
              isChanged: JSON.stringify(oldSub[subK]) !== JSON.stringify(newSub[subK])
            });
          });
        }
      } else {
        diffs.push({
          label: formatKey(key),
          old: oldVal,
          new: newVal,
          isChanged: JSON.stringify(oldVal) !== JSON.stringify(newVal)
        });
      }
    });

    return diffs;
  };

  const diffs = getDiffs();

  return (
    <div className={cn(
      "w-full overflow-hidden rounded-3xl border border-gray-100 dark:border-blue-500/20 bg-white dark:bg-[#050B18]/60 backdrop-blur-xl transition-all duration-500",
      !minimal && "shadow-lg dark:shadow-[0_0_40px_rgba(59,130,246,0.1)]"
    )}>
      {/* Glow Header */}
      {!minimal && (
        <div className="relative p-6 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10">
          <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/5 blur-[80px]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-500 animate-pulse" />
              <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.4em]">
                State Transformation Payload
              </h3>
            </div>
            <Activity className="w-4 h-4 text-blue-500/30" />
          </div>
        </div>
      )}

      {/* Panels Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-white/5 h-full">
        {/* Previous State Panel */}
        <div className="flex flex-col">
          <div className="px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-600 dark:text-rose-500/80">
              Previous State
            </p>
          </div>
          <div className="p-6 space-y-3">
            {diffs.map((diff, idx) => (
              <div key={`old-${idx}`} className="flex flex-col gap-1.5 min-h-[54px] justify-center">
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">{diff.label}</span>
                <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5">
                  <span className={cn(
                    "text-xs font-mono break-all",
                    diff.isChanged ? "text-gray-400 dark:text-gray-500 opacity-50 italic" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {formatValue(diff.label, diff.old)}
                  </span>
                </div>
              </div>
            ))}
            {diffs.length === 0 && <p className="text-xs text-gray-500 italic py-8 text-center">No trace data</p>}
          </div>
        </div>

        {/* Mutation Result Panel */}
        <div className="flex flex-col bg-blue-500/[0.01]">
          <div className="px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-500/80">
              Mutation Result
            </p>
          </div>
          <div className="p-6 space-y-3">
            {diffs.map((diff, idx) => (
              <div key={`new-${idx}`} className="flex flex-col gap-1.5 min-h-[54px] justify-center">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">{diff.label}</span>
                  {diff.isChanged && (
                    <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <Zap className="w-2.5 h-2.5 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                  )}
                </div>
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  diff.isChanged 
                    ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                    : "bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5"
                )}>
                  <span className={cn(
                    "text-xs font-mono break-all",
                    diff.isChanged 
                      ? "text-emerald-600 dark:text-emerald-500 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {formatValue(diff.label, diff.new)}
                  </span>
                </div>
              </div>
            ))}
            {diffs.length === 0 && <p className="text-xs text-gray-500 italic py-8 text-center">No trace data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
