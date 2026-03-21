"use client";

import { X, Clock, User, History, Database, Code } from "lucide-react";
import { formatDate, cn, getAuditDescription } from "@/lib/utils";
import { AuditTraceView } from "@/components/audit/AuditTraceView";

import { Modal } from "@/components/ui/Modal";

interface AuditDetailsModalProps {
  log: any;
  onClose: () => void;
}

export function AuditDetailsModal({ log, onClose }: AuditDetailsModalProps) {
  if (!log) return null;

  return (
    <Modal isOpen={!!log} onClose={onClose}>
      {/* Header */}
      <div className="p-8 border-b border-white/5 relative bg-gradient-to-r from-blue-500/5 to-transparent shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Audit Mutation Details</h3>
              <p className="text-gray-500 text-[11px] font-medium leading-relaxed max-w-md">
                {getAuditDescription(log.action, log.targetModel)}
              </p>
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
      <div className="p-8 overflow-y-auto space-y-8 flex-1 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10">
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

        {/* Payload Comparison - High Tech Trace */}
        {(log.oldValue || log.newValue) ? (
          <div className="space-y-4">
            <AuditTraceView oldValue={log.oldValue} newValue={log.newValue} />
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
    </Modal>
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
