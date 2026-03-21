"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShieldCheck, Search, Filter, ChevronLeft, ChevronRight, RefreshCcw, Download, Eye, History, User, Clock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDate, cn, getAuditDescription } from "@/lib/utils";
import { useSocket } from "@/components/providers/SocketProvider";
import { exportToPDF, exportToCSV } from "@/lib/export-utils";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { AuditTraceView } from "@/components/audit/AuditTraceView";

export default function ActivityLedgerPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();
  
  // Filters
  const [actionType, setActionType] = useState("");
  const [targetModel, setTargetModel] = useState("");
  
  // Modal State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  
  const { socket } = useSocket();

  const fetchLogs = async (currentPage = pagination.page) => {
    setIsLoading(true);
    setIsContentLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (actionType) query.append("actionType", actionType);
      if (targetModel) query.append("targetModel", targetModel);

      const res = await fetch(`/api/audit?${query.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");
      
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1); // Reset to page 1 on filter change
  }, [actionType, targetModel]);

  useEffect(() => {
    fetchLogs(pagination.page);
  }, [pagination.page]);

  useEffect(() => {
    if (!socket) return;
    const handleInvalidate = () => fetchLogs(pagination.page);
    socket.on("invalidate-data", handleInvalidate);
    return () => {
      socket.off("invalidate-data", handleInvalidate);
    };
  }, [socket, pagination.page, actionType, targetModel]);

  // Styling maps based on Dark Blue/Blue QuoteXStudio branding
  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20";
    if (action.includes("DELETE")) return "text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20";
    if (action.includes("UPDATE")) return "text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20";
    return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20";
  };

  const modelMap = ["Investment", "Expense", "Project", "FiverrIncome", "FiverrWithdrawal"];

  const handleExportPDF = () => {
    const headers = ["Timestamp", "Actor", "Operation", "Target ID"];
    const exportData = logs.map((log: any) => [
      `${formatDate(log.createdAt)} ${new Date(log.createdAt).toLocaleTimeString()}`,
      log.actor?.name || "Unknown",
      (log.action || "SYSTEM_OP").replace(/_/g, " "),
      log.targetId || "GLOBAL"
    ]);

    exportToPDF("System Matrix Audit Log", headers, exportData, `QuoteX_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportCSV = () => {
    const exportData = logs.map((log: any) => ({
      Timestamp: log.createdAt,
      Actor: log.actor?.name || "Unknown",
      Role: log.actor?.role || "N/A",
      Action: log.action,
      Module: log.targetModel,
      TargetID: log.targetId,
      NewValue: JSON.stringify(log.newValue || {}),
      OldValue: JSON.stringify(log.oldValue || {})
    }));

    exportToCSV(exportData, `QuoteX_Audit_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            System Matrix Ledger
          </h1>
          <p className="text-slate-400 dark:text-gray-500 mt-2 transition-colors">Immutable system-wide telemetry tracking all structural state mutations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={isLoading || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all uppercase tracking-widest disabled:opacity-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isLoading || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-600/20 rounded-xl text-[10px] font-black text-blue-600 dark:text-blue-500 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest shadow-sm dark:shadow-blue-500/5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button onClick={() => fetchLogs()} disabled={isLoading} className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm">
            <RefreshCcw className={`w-4 h-4 text-slate-400 transition-colors ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl items-center shadow-xl dark:shadow-none transition-all duration-300">
        <div className="flex items-center gap-2 text-slate-400 dark:text-gray-400 font-medium px-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter Stream:</span>
        </div>
        
        <select 
          value={targetModel}
          onChange={(e) => setTargetModel(e.target.value)}
          className="bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 flex-1 w-full shadow-sm transition-all"
        >
          <option value="">All Structural Modules</option>
          {modelMap.map(m => (
            <option key={m} value={m}>{m} Module</option>
          ))}
        </select>

        <select 
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 flex-1 w-full shadow-sm transition-all"
        >
          <option value="">All Mutations</option>
          <option value="CREATE_INVESTMENT">Create Investment</option>
          <option value="UPDATE_INVESTMENT">Update Investment</option>
          <option value="UPDATE_INVESTMENT_STATUS">Investment Status Flow</option>
          <option value="DELETE_INVESTMENT">Delete Investment</option>
          <option value="CREATE_EXPENSE">Log Expense</option>
          <option value="UPDATE_EXPENSE">Update Expense</option>
          <option value="DELETE_EXPENSE">Delete Expense</option>
          <option value="CREATE_PROJECT">Initialize Project</option>
          <option value="UPDATE_PROJECT">Update Project</option>
          <option value="CREATE_FIVERR_INCOME">Fiverr Income</option>
          <option value="CREATE_FIVERR_WITHDRAWAL">Fiverr Withdrawal</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden relative shadow-xl dark:shadow-none transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] transition-colors">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-48 text-center transition-colors">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-48 text-center transition-colors">Actor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-64 text-center transition-colors">Operation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center transition-colors">Payload Fingerprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
              {logs.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-gray-600 text-sm italic transition-colors">
                    No matching telemetry logs found in the matrix.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log._id} className="transition-colors group hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">{formatDate(log.createdAt)}</div>
                      <div className="text-[10px] text-slate-400 dark:text-gray-600 mt-0.5 transition-colors">{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-center group/actor cursor-help">
                        {log.actor?.image ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 shadow-sm group-hover/actor:border-blue-500/50 transition-all">
                            <Image 
                              src={log.actor.image} 
                              alt={log.actor.name} 
                              width={32} 
                              height={32} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-blue-600/40 flex items-center justify-center text-[10px] font-bold text-white border border-slate-200 dark:border-white/10 shrink-0 shadow-sm">
                            {log.actor?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="flex flex-col items-start translate-x-[-2px]">
                          <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors uppercase tracking-widest leading-tight">
                            {log.actor?.name?.split(" ")[0]}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-tighter transition-colors">{log.actor?.role?.replace("_", " ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter mx-auto inline-block border transition-all", getActionColor(log.action || "SYSTEM_OP"))}>
                        {(log.action || "SYSTEM_OP").replace(/_/g, " ")}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-gray-500 font-medium leading-relaxed mt-1 max-w-[180px] mx-auto italic transition-colors">
                        {getAuditDescription(log.action, log.targetModel)}
                      </p>
                      <div className="text-[9px] text-slate-300 dark:text-gray-700 mt-1 font-mono uppercase tracking-tighter font-black opacity-50 transition-colors">{log.targetModel}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-left">
                          <div className="text-[10px] font-mono text-slate-500 dark:text-gray-400 truncate max-w-[120px] transition-colors">
                            ID: {log.targetId?.substring(0, 8) || "GLOBAL"}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-gray-600 mt-0.5 flex items-center gap-2 transition-colors">
                            {log.newValue && <span className="text-emerald-600 dark:text-emerald-500/60 font-bold tracking-tighter uppercase whitespace-nowrap">+ UPDATED</span>}
                            {log.oldValue && <span className="text-amber-600 dark:text-amber-500/60 font-bold tracking-tighter uppercase whitespace-nowrap">• SNAPSHOT</span>}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setSelectedLog(log);
                            setShowModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[10px] font-black text-blue-600 dark:text-blue-500 transition-all shadow-sm uppercase tracking-widest whitespace-nowrap active:scale-95 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                        >
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between transition-all">
          <p className="text-xs font-medium text-slate-400 dark:text-gray-500 transition-colors">
            Showing <strong className="text-slate-900 dark:text-white transition-colors">{logs.length}</strong> traces of <strong className="text-slate-900 dark:text-white transition-colors">{pagination.total}</strong> total
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-white/5 transition-all border border-slate-200 dark:border-white/5 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[32px] text-center transition-colors">{pagination.page} <span className="text-slate-400 dark:text-gray-600 font-normal">/</span> {pagination.totalPages}</span>
            <button 
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-white/5 transition-all border border-slate-200 dark:border-white/5 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AuditDetailModal 
          log={selectedLog}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedLog(null);
          }}
        />
      </div>
    </div>
  );
}

// --- Helper Components & Logic for Human-Readable Audit ---

function AuditDetailModal({ log, isOpen, onClose }: { log: any; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 overflow-hidden">
      <div className="fixed inset-0 w-screen h-screen bg-slate-900/40 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-start justify-between transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm transition-all">
              <History className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Audit Mutation Details</h2>
              <p className="text-slate-400 dark:text-gray-500 text-[11px] font-medium leading-relaxed max-w-md mt-0.5 transition-colors">
                {getAuditDescription(log.action, log.targetModel)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20 text-[9px] font-black uppercase tracking-tighter transition-all">
                  {(log.action || "SYSTEM_OP").replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono transition-colors">ID: {log.targetId}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-all shadow-sm">
            <RefreshCcw className="w-5 h-5 rotate-45" />
          </button>
        </div>

        {/* Audit Metadata Card */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 transition-all">
          <div className="p-4 flex items-center gap-3 bg-white dark:bg-[#0a0a0a] transition-colors">
            <User className="w-4 h-4 text-slate-400 dark:text-gray-500" />
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest transition-colors">Modified By</p>
              <p className="text-sm font-bold text-slate-700 dark:text-gray-300 transition-colors">{log.actor?.name || "System"}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3 bg-white dark:bg-[#0a0a0a] transition-colors">
            <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest transition-colors">Timestamp</p>
              <p className="text-sm font-bold text-slate-700 dark:text-gray-300 transition-colors">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* High-Tech Diff Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 dark:bg-transparent">
          <AuditTraceView oldValue={log.oldValue} newValue={log.newValue} />
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex justify-end transition-colors">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-white/5 hover:bg-slate-800 dark:hover:bg-white/10 border border-slate-800 dark:border-white/10 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg"
          >
            Acknowledge Trace
          </button>
        </div>
      </div>
    </div>
  );
}
