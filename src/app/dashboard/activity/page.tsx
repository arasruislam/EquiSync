"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShieldCheck, Search, Filter, ChevronLeft, ChevronRight, RefreshCcw, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useSocket } from "@/components/providers/SocketProvider";
import { exportToPDF, exportToCSV } from "@/lib/export-utils";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";

export default function ActivityLedgerPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();
  
  // Filters
  const [actionType, setActionType] = useState("");
  const [targetModel, setTargetModel] = useState("");
  
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
    if (action.includes("CREATE")) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    if (action.includes("DELETE")) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (action.includes("UPDATE")) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  };

  const modelMap = ["Investment", "Expense", "Project", "FiverrIncome", "FiverrWithdrawal"];

  const handleExportPDF = () => {
    const headers = ["Timestamp", "Actor", "Operation", "Target ID"];
    const data = logs.map((log: any) => [
      `${formatDate(log.createdAt)} ${new Date(log.createdAt).toLocaleTimeString()}`,
      log.actor?.name || "Unknown",
      log.action.replace(/_/g, " "),
      log.targetId
    ]);

    exportToPDF("System Matrix Audit Log", headers, data, `QuoteX_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
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
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            System Matrix Ledger
          </h1>
          <p className="text-gray-500 mt-2">Immutable system-wide telemetry tracking all structural state mutations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={isLoading || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-400 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isLoading || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-xl text-[10px] font-black text-blue-500 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest shadow-lg shadow-blue-500/5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button onClick={() => fetchLogs()} disabled={isLoading} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-95 disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[#0f0f0f] border border-white/5 rounded-2xl items-center">
        <div className="flex items-center gap-2 text-gray-400 font-medium px-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter Stream:</span>
        </div>
        
        <select 
          value={targetModel}
          onChange={(e) => setTargetModel(e.target.value)}
          className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1 w-full"
        >
          <option value="">All Structural Modules</option>
          {modelMap.map(m => (
            <option key={m} value={m}>{m} Module</option>
          ))}
        </select>

        <select 
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1 w-full"
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
      <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-48 text-center">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-48 text-center">Actor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-64 text-center">Operation</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Payload Fingerprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-600 text-sm italic">
                    No matching telemetry logs found in the matrix.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-300">{formatDate(log.createdAt)}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-center group/actor cursor-help">
                        {log.actor?.image ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 shadow-lg group-hover/actor:border-blue-500/50 transition-all">
                            <Image 
                              src={log.actor.image} 
                              alt={log.actor.name} 
                              width={32} 
                              height={32} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-blue-600/40 flex items-center justify-center text-[10px] font-bold text-white border border-white/10 shrink-0 shadow-lg">
                            {log.actor?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="flex flex-col items-start translate-x-[-2px]">
                          <div className="text-sm font-bold text-white group-hover/actor:text-blue-400 transition-colors uppercase tracking-widest leading-tight">
                            {log.actor?.name?.split(" ")[0]}
                          </div>
                          <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-tighter">{log.actor?.role?.replace("_", " ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border mx-auto inline-block ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <div className="text-[10px] text-gray-600 mt-1 font-mono">{log.targetModel}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-xs font-mono text-gray-500 truncate max-w-[250px] mx-auto">
                        ID: {log.targetId}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5 flex items-center justify-center gap-2">
                        {log.newValue && <span className="text-emerald-500/80 font-semibold">+ STATE CAPTURED</span>}
                        {log.oldValue && <span className="text-amber-500/80 font-semibold">• SNAPSHOT SAVED</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">
            Showing <strong className="text-white">{logs.length}</strong> traces of <strong className="text-white">{pagination.total}</strong> total
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-colors border border-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white min-w-[32px] text-center">{pagination.page} <span className="text-gray-600 font-normal">/</span> {pagination.totalPages}</span>
            <button 
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-colors border border-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
