"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Globe, 
  Activity,
  ArrowRight,
  ShieldCheck,
  Lock,
  History,
  ChevronRight
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { AuditDetailsModal } from "@/components/dashboard/AuditDetailsModal";

interface AuditLog {
  _id: string;
  action: string;
  actor: { name: string; email: string; role: string };
  targetModel: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  status: "SUCCESS" | "FAILURE";
  createdAt: string;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Matrix</h1>
            <p className="text-gray-500 text-sm font-medium">Mutation focus: Recording data state transformations only.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Mutation Feed
          </div>
        </div>
      </div>

      <div className="bg-[#0A0F1D] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl shadow-blue-500/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-2xl px-5 py-3 w-full max-w-md focus-within:border-blue-500/30 transition-all group">
            <Search className="w-4 h-4 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Search actor or mutation type..." className="bg-transparent text-sm text-white placeholder:text-gray-700 outline-none w-full font-medium" />
          </div>
          <button className="p-3 rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all border border-white/5">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto px-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-6 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Sequence</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Authorized Actor</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Operation Label</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Status / Trace</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] text-right">State Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 && !isLoading ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-600 italic font-medium">No record mutations detected in the system matrix.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-all group relative">
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-800 group-hover:text-blue-500 transition-colors" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white tracking-tight">{formatDate(log.createdAt)}</span>
                          <span className="text-[10px] text-gray-600 font-black uppercase tracking-tighter">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/5 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10 uppercase">
                          {log.actor.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white tracking-tight">{log.actor.name}</span>
                          <span className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">{log.actor.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-gray-300 tracking-[0.15em] uppercase px-2 py-1 bg-white/5 rounded-lg w-fit">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1.5 ml-1">
                          Ref: {log.targetModel || "SYSTEM"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                              log.status === "SUCCESS" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"
                            )} />
                            <span className={cn(
                              "text-[10px] font-black tracking-widest uppercase",
                              log.status === "SUCCESS" ? "text-emerald-500" : "text-rose-500"
                            )}>{log.status}</span>
                         </div>
                         <span className="text-[10px] text-gray-600 font-mono tracking-tighter mt-1.5 flex items-center gap-1.5">
                           <Globe className="w-3 h-3" />
                           {log.ipAddress || "INTERNAL-TRACE"}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="px-4 py-2 rounded-xl bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-500/10"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <AuditDetailsModal 
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="p-6 bg-gradient-to-br from-indigo-500/5 to-primary/5 border border-white/5 rounded-3xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-1">Security Compliance</h4>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              These logs are tamper-proof and cryptographically signed within the session context. 
              Any modification attempt will flag a system-wide security alert.
            </p>
          </div>
        </div>
        <div className="p-6 bg-[#0f0f0f] border border-white/5 rounded-3xl flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
               <h4 className="text-sm font-bold text-white mb-1">Session Auditing</h4>
               <p className="text-xs text-gray-600">Tracking actor behavior across all financial modules.</p>
             </div>
           </div>
           <ChevronRight className="w-5 h-5 text-gray-700" />
        </div>
      </div>
    </div>
  );
}

