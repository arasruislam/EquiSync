"use client";

import { X, Search, Clock, User, ArrowRight, History, Database, Code } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface AuditDetailsModalProps {
  log: any;
  onClose: () => void;
}

export function AuditDetailsModal({ log, onClose }: AuditDetailsModalProps) {
  if (!log) return null;

  const renderJsonValue = (value: any) => {
    if (typeof value === "object" && value !== null) {
      return (
        <pre className="text-[10px] font-mono text-gray-400 bg-black/40 p-3 rounded-xl overflow-x-auto max-h-60 border border-white/5">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return <span className="text-sm font-medium text-white">{String(value)}</span>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050B18]/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-[#0A0F1D] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 relative bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Audit Mutation Details</h3>
                <p className="text-gray-500 text-sm font-medium">Granular state analysis for {log.action}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-8">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Actor</span>
              </div>
              <p className="text-white font-bold">{log.actor?.name || "Unknown"}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter mt-0.5">{log.actor?.role}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</span>
              </div>
              <p className="text-white font-bold">{formatDate(log.createdAt)}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">
                {new Date(log.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Resource</span>
              </div>
              <p className="text-white font-bold">{log.targetModel || "System"}</p>
              <p className="text-[10px] text-gray-600 font-mono tracking-tighter truncate mt-0.5">{log.targetId || "Global"}</p>
            </div>
          </div>

          {/* Payload Comparison */}
          {(log.oldValue || log.newValue) ? (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Code className="w-3.5 h-3.5" />
                State Transformation Payload
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Previous State */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Previous State</span>
                  </div>
                  <div className="bg-[#050B18] rounded-2xl border border-rose-500/10 p-4 ring-1 ring-rose-500/20">
                    {log.oldValue ? renderJsonValue(log.oldValue) : (
                      <div className="h-20 flex items-center justify-center text-gray-700 italic text-sm">
                        No previous record found (Create op)
                      </div>
                    )}
                  </div>
                </div>

                {/* New State */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Mutation Result</span>
                  </div>
                  <div className="bg-[#050B18] rounded-2xl border border-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
                    {log.newValue ? renderJsonValue(log.newValue) : (
                      <div className="h-20 flex items-center justify-center text-gray-700 italic text-sm">
                        No final state captured (Delete op)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-[32px] border border-dashed border-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-700 mb-4">
                <Code className="w-8 h-8" />
              </div>
              <h4 className="text-white font-bold mb-1">No Payload Captured</h4>
              <p className="text-gray-600 text-sm">This action did not record a granular before/after diff.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              log.status === "SUCCESS" ? "bg-emerald-500" : "bg-rose-500"
            )} />
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Transaction Verified</span>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

// Internal Activity Icon Component (Simplified)
function Activity({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
