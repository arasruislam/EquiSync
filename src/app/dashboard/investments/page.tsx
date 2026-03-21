"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { 
  Plus, 
  Wallet, 
  Trash2, 
  Search, 
  Filter, 
  Download,
  Calendar,
  DollarSign,
  Info,
  ChevronRight,
  Edit2,
  Lock,
  TrendingUp,
  Clock
} from "lucide-react";
import dynamic from "next/dynamic";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
const ConfirmDeleteModal = dynamic(() => import("@/components/ui/ConfirmDeleteModal").then(mod => mod.ConfirmDeleteModal), { ssr: false });
import { useSocket } from "@/components/providers/SocketProvider";
import { fetchLiveExchangeRate } from "@/lib/exchange-rate";
import { SummaryWidget } from "@/components/dashboard/SummaryWidget";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { Modal } from "@/components/ui/Modal";

interface IContribution {
  coOwner: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  amountUSD: number;
  amountBDT: number;
  paidAmountBDT?: number;
  paidAmountUSD?: number;
  status: "PENDING" | "CLEARED";
}

interface Investment {
  _id: string;
  contributions: IContribution[];
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  note?: string;
  date: string;
}

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  
  // Static Co-Founders for Checklist
  const coFounders = [
    { id: "650000000000000000000001", name: "Rahul Roy Nipon" }, // Replaced in effect
    { id: "650000000000000000000002", name: "Ashraful Islam" },
    { id: "650000000000000000000003", name: "Saifur Rahman" },
  ];



  // Form State
  const [amountBDT, setAmountBDT] = useState("");
  const [exchangeRate, setExchangeRate] = useState("120"); // Default BDT rate
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  // Simplified Filter State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeframeFilter, setTimeframeFilter] = useState("ALL");
  const [startDateFilter, setStartDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const { socket } = useSocket();

  useEffect(() => {
    fetchReports();
    fetchLiveExchangeRate().then(rate => setExchangeRate(rate.toString()));
  }, []);

  // Fetch data on filter change
  useEffect(() => {
    fetchInvestments();
  }, [statusFilter, timeframeFilter, startDateFilter]);

  useEffect(() => {
    if (!socket) return;
    const handleInvalidate = () => {
      fetchInvestments();
      fetchReports();
    };
    socket.on("invalidate-data", handleInvalidate);
    return () => {
      socket.off("invalidate-data", handleInvalidate);
    };
  }, [socket]);



  const fetchInvestments = async () => {
    setIsContentLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (timeframeFilter !== "ALL") {
        params.append("timeframe", timeframeFilter);
        if (timeframeFilter === "SPECIFIC") {
          params.append("startDate", startDateFilter);
        }
      }

      const res = await fetch(`/api/investments?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setInvestments(json || []);
    } catch (err) { console.error(err); }
    finally { 
      setIsLoading(false); 
      setIsContentLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchInvestments(),
      fetchReports()
    ]);
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rate = parseFloat(exchangeRate) || 120;
    const totalBDT = parseFloat(amountBDT);

    if (isNaN(totalBDT) || totalBDT <= 0) {
      alert("Please enter a valid investment amount.");
      setIsSubmitting(false);
      return;
    }

    const totalUSD = totalBDT / rate;

    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountBDT: totalBDT,
          exchangeRate: rate,
          note,
          date,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setNote("");
        setAmountBDT("");
        refreshData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add investment");
      }
    } catch (err) {
      console.error("Failed to add investment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (inv: Investment) => {
    setEditingInvestmentId(inv._id);
    setAmountBDT(inv.amountBDT.toString());
    setExchangeRate(inv.exchangeRate.toString());
    setNote(inv.note || "");
    setDate(inv.date.split("T")[0]);
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingInvestmentId(null);
    setAmountBDT("");
    setExchangeRate("120");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleEditInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestmentId) return;
    setIsSubmitting(true);

    const rate = parseFloat(exchangeRate) || 120;
    const totalBDT = parseFloat(amountBDT);

    if (isNaN(totalBDT) || totalBDT <= 0) {
      alert("Please enter a valid investment amount.");
      setIsSubmitting(false);
      return;
    }

    const totalUSD = totalBDT / rate;

    try {
      const res = await fetch(`/api/investments/${editingInvestmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountBDT: totalBDT,
          exchangeRate: rate,
          note,
          date,
        }),
      });

      if (res.ok) {
        closeEditForm();
        refreshData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update investment");
      }
    } catch (err) {
      console.error("Failed to update investment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (investmentId: string, coOwnerId: string, currentStatus: string) => {
    if (session?.user?.role !== "SUPER_ADMIN") return;
    
    const newStatus = currentStatus === "PENDING" ? "CLEARED" : "PENDING";
    
    try {
      const res = await fetch(`/api/investments/${investmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coOwnerId, status: newStatus }),
      });

      if (res.ok) {
        refreshData(); // Refresh table and global reports instantly
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/investments/${itemToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setItemToDelete(null);
        refreshData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete investment");
      }
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalBDT = investments.reduce((sum, inv) => sum + (inv.amountBDT || 0), 0);
  const totalUSD = totalBDT / (parseFloat(exchangeRate) || 120);

  const clearedBDT = investments.reduce((sum, inv) => 
    sum + inv.contributions.reduce((cSum, c) => c.status === "CLEARED" ? cSum + (c.paidAmountBDT || c.amountBDT || 0) : cSum, 0)
  , 0);
  const clearedUSD = clearedBDT / (parseFloat(exchangeRate) || 120);

  const pendingBDT = investments.reduce((sum, inv) => 
    sum + inv.contributions.reduce((cSum, c) => c.status === "PENDING" ? cSum + ((c.amountBDT || 0) - (c.paidAmountBDT || 0)) : cSum, 0)
  , 0);
  const pendingUSD = pendingBDT / (parseFloat(exchangeRate) || 120);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Founder Investments</h1>
            <p className="text-slate-400 dark:text-gray-500 text-sm transition-colors duration-300">Track capital injections from Rahul, Ashraful, and Saifur.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-300 transition-all">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          {session?.user?.role === "SUPER_ADMIN" && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Investment
            </button>
          )}
        </div>
      </div>

      {/* Personalized Metrics Section */}
      {session?.user?.role === "CO_FOUNDER" && reportData?.coFounderStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl relative overflow-hidden group shadow-sm dark:shadow-blue-900/10 transition-all duration-300">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 relative z-10 text-center">Your Total Investment</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white relative z-10 text-center">
              {formatCurrency(reportData.coFounderStats.totalInvestedBDT, "BDT")}
            </h3>
            <div className="text-[10px] text-blue-500 dark:text-blue-400/50 mt-2 font-black uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Aggregate Cleared
            </div>
          </div>
          <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-blue-400/20 rounded-2xl relative overflow-hidden group shadow-sm dark:shadow-indigo-900/10 transition-all duration-300">
            <p className="text-[10px] font-black text-indigo-600 dark:text-blue-300 uppercase tracking-widest mb-1 relative z-10 text-center">Your Pending Dues</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white relative z-10 text-center">
              {formatCurrency(reportData.coFounderStats.totalPendingDuesBDT, "BDT")}
            </h3>
            <div className="text-[10px] text-indigo-500 dark:text-blue-300/50 mt-2 font-black uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Owed to Quotex
            </div>
          </div>
        </div>
      )}

      {/* Founder Summary Cards - Visible to Admin and Co-Founders */}
      {["SUPER_ADMIN", "CO_FOUNDER"].includes(session?.user?.role as string) && reportData?.allCoFounderStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportData.allCoFounderStats.map((founder: any) => (
            <div key={founder.userId} className="p-5 bg-white dark:bg-[#0a0a0a] border border-slate-100 dark:border-white/5 rounded-2xl hover:border-blue-500/30 transition-all group/card shadow-xl dark:shadow-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0">
                  {founder.image ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-900 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover/card:border-blue-500 group-hover/card:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                      <Image 
                        src={founder.image} 
                        alt={founder.name} 
                        width={40} 
                        height={40} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border-2 border-primary/20">
                      {founder.name[0]}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 dark:text-white group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors uppercase tracking-tight">{founder.name}</span>
                  <span className="text-[9px] text-slate-400 dark:text-gray-600 font-black uppercase tracking-widest">Co-Founder</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 dark:text-gray-500 uppercase tracking-wider">Invested</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(founder.totalInvestedBDT, "BDT")}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 dark:text-gray-500 uppercase tracking-wider">Pending</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(founder.totalPendingDuesBDT, "BDT")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryWidget 
          label="Total Company Capital"
          amountBDT={totalBDT}
          amountUSD={totalUSD}
          icon={Wallet}
          themeColor="blue"
          description="Active Vault Balance"
        />
        
        <SummaryWidget 
          label="Cleared Funds (Received)"
          amountBDT={clearedBDT}
          amountUSD={clearedUSD}
          icon={TrendingUp}
          themeColor="emerald"
          description="Actual paid capital"
        />
        
        <SummaryWidget 
          label="Pending Approvals (Owed)"
          amountBDT={pendingBDT}
          amountUSD={pendingUSD}
          icon={Clock}
          themeColor="amber"
          description="Awaiting founder transfer"
        />
      </div>

      {/* Investments Table Container */}
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-2xl shadow-xl dark:shadow-sm overflow-visible">
        {/* Simplified Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-gray-400 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1c1c1c] min-w-[150px] text-center uppercase tracking-widest shadow-sm hover:text-slate-900 dark:hover:text-white"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CLEARED">Cleared</option>
            </select>

            {/* Timeframe Filter */}
            <select 
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-gray-400 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1c1c1c] min-w-[150px] text-center uppercase tracking-widest shadow-sm hover:text-slate-900 dark:hover:text-white"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="YEAR">This Year</option>
              <option value="SPECIFIC">Specific Date</option>
            </select>

            {(statusFilter !== "ALL" || timeframeFilter !== "ALL") && (
              <button 
                onClick={() => {
                  setStatusFilter("ALL");
                  setTimeframeFilter("ALL");
                  setStartDateFilter(new Date().toISOString().split("T")[0]);
                }}
                className="p-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10 transition-all font-black text-[10px] uppercase tracking-tighter"
                title="Reset Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Specific Date Picker */}
        {timeframeFilter === "SPECIFIC" && (
          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-center gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 bg-white dark:bg-[#111] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Select Date:</span>
              <input 
                type="date" 
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider text-center">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Investor Splits</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Total (USD)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Total (BDT)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Note</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-slate-100 dark:divide-white/5">
              {investments.length === 0 && !isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-gray-500 italic">No investment entries found.</td></tr>
              ) : (
                investments.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-400 whitespace-nowrap text-center font-medium">
                      {formatDate(inv.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-center justify-center">
                        {inv.contributions.map((c, i) => {
                          const paid = c.paidAmountBDT || 0;
                          const target = c.amountBDT || 0;
                          const owed = Math.max(0, target - paid);
                          
                          return (
                          <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-[#111] p-1.5 rounded-lg border border-slate-200 dark:border-white/5 w-full max-w-sm justify-between shadow-sm">
                            <button
                              onClick={() => handleToggleStatus(inv._id, c.coOwner._id, c.status)}
                              disabled={session?.user?.role !== "SUPER_ADMIN" || c.status === "CLEARED"}
                              className={cn(
                                "w-20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all text-center border",
                                c.status === "CLEARED" 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" 
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20 hover:bg-rose-500/20 active:scale-95",
                                (session?.user?.role !== "SUPER_ADMIN" || c.status === "CLEARED") && "cursor-not-allowed opacity-80"
                              )}
                            >
                              {c.status}
                            </button>
                            <div className="flex items-center gap-3 flex-1 justify-start ml-4">
                              <div className="relative shrink-0">
                                {c.coOwner.image ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-900 group-hover:border-blue-500 transition-colors shadow-sm">
                                    <Image 
                                      src={c.coOwner.image} 
                                      alt={c.coOwner.name} 
                                      width={32} 
                                      height={32} 
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#111624] border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-gray-500 group-hover:border-blue-500/50 transition-all">
                                    {c.coOwner.name.charAt(0)}
                                  </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#111] rounded-full" />
                              </div>
                              <span className="text-slate-700 dark:text-gray-300 text-xs font-black uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-white transition-colors">{c.coOwner.name}</span>
                            </div>
                            <div className="flex flex-col text-center w-28 pr-1">
                              <span className="text-gray-900 dark:text-white font-mono text-[11px] font-bold">
                                {c.status === "CLEARED" || owed === 0 
                                  ? "Paid: " + formatCurrency(target, "BDT") 
                                  : "Due: " + formatCurrency(owed, "BDT")}
                              </span>
                              {c.status === "PENDING" && paid > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-500/70 text-[9px] font-mono leading-tight">
                                  Paid: {formatCurrency(paid, "BDT")}
                                </span>
                              )}
                            </div>
                          </div>
                        )})}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-400 text-center">
                      {formatCurrency(inv.amountUSD, "USD")}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold text-center">
                      {formatCurrency(inv.amountBDT, "BDT")}
                      <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 font-medium">@ {inv.exchangeRate}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-400 truncate max-w-xs text-center font-medium">
                      {inv.note || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 h-full w-full">
                        {session?.user?.role === "SUPER_ADMIN" && (
                          <>
                            {inv.contributions.length > 0 && inv.contributions.every(c => c.status === "CLEARED") ? (
                              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded text-[9px] uppercase tracking-widest font-black text-blue-500/60 cursor-not-allowed mx-auto min-w-[100px]" title="100% Cleared - Read Only/Archived">
                                <Lock className="w-3 h-3 text-blue-500 animate-pulse" />
                                <span>Archived</span>
                              </div>
                            ) : (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditForm(inv);
                                }}
                                className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
                                title="Edit Investment"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (inv.contributions.some(c => c.status === "CLEARED" || (c.paidAmountBDT && c.paidAmountBDT > 0))) {
                                    alert("Deletion locked: Investment contains partially or fully cleared funds.");
                                    return;
                                  }
                                  setItemToDelete(inv._id);
                                }}
                                disabled={inv.contributions.some(c => c.status === "CLEARED" || (c.paidAmountBDT && c.paidAmountBDT > 0))}
                                className={cn(
                                  "p-2 transition-colors",
                                  inv.contributions.some(c => c.status === "CLEARED" || (c.paidAmountBDT && c.paidAmountBDT > 0))
                                    ? "text-gray-800 cursor-not-allowed"
                                    : "text-gray-600 hover:text-red-500"
                                )}
                                title={inv.contributions.some(c => c.status === "CLEARED" || (c.paidAmountBDT && c.paidAmountBDT > 0)) ? "Deletion Locked" : "Delete Investment"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} className="max-w-3xl">
        {/* Header - Sticky */}
        <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Record New Investment
          </h2>
          <button 
            onClick={() => setShowAddForm(false)}
            className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAddInvestment} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-track-slate-100 dark:scrollbar-track-white/5 scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Total Investment (BDT)</label>
                <div className="relative h-14 group">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-slate-400 dark:text-gray-500 font-bold text-xl group-focus-within:text-primary transition-colors">৳</span>
                  </div>
                  <input 
                    type="number" 
                    required 
                    value={amountBDT}
                    onChange={(e) => setAmountBDT(e.target.value)}
                    placeholder="e.g. 360000"
                    className="w-full h-full bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 text-slate-900 dark:text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg font-mono placeholder:text-slate-300 dark:placeholder:text-gray-800 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">USD Equivalent (Read-Only)</label>
                <div className="relative h-14">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-primary/40 font-bold text-xl">$</span>
                  </div>
                  <input 
                    type="text" 
                    readOnly
                    value={amountBDT && exchangeRate ? (parseFloat(amountBDT) / parseFloat(exchangeRate)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
                    className="w-full h-full bg-slate-100/50 dark:bg-[#111111]/50 border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 text-primary/60 dark:text-primary/60 outline-none font-mono text-lg cursor-not-allowed shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Exchange Rate (1$ = ?)</label>
                <div className="relative h-14 group">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-slate-400 dark:text-gray-500 font-bold text-lg group-focus-within:text-primary transition-colors">৳</span>
                  </div>
                  <input 
                    type="number" 
                    required 
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder=" e.g. 120"
                    className="w-full h-full bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 text-slate-900 dark:text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-mono shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Effective Date</label>
                <div className="relative h-14 group">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type="date" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-full bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all dark:[color-scheme:dark] uppercase tracking-widest text-xs font-bold shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Note / Reference (Mandatory Trace)</label>
              <textarea 
                value={note}
                required
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Initial cloud server setup capital or marketing budget for Q1"
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-2xl py-5 px-6 text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all resize-none text-sm placeholder:text-slate-300 dark:placeholder:text-gray-700 font-medium shadow-sm"
              />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex gap-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-bold">
                This transaction will be recorded in the central ledger under <span className="text-white font-black tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded ml-1">CREDIT (Investment)</span>. 
                It will record a total company capital requirement of <span className="text-primary font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded ml-1">
                  {parseFloat(amountBDT || "0").toLocaleString()} BDT
                </span> (~ ${amountBDT && exchangeRate ? (parseFloat(amountBDT) / parseFloat(exchangeRate)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"} USD), establishing 3 equal <span className="text-white font-bold uppercase tracking-[0.2em] ml-1">Pending</span> dues of <span className="text-primary font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded ml-1">{(parseFloat(amountBDT || "0") / 3).toLocaleString(undefined, {maximumFractionDigits: 2})} BDT</span> per Co-Founder.
              </p>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="p-10 border-t border-slate-100 dark:border-white/5 flex gap-6 shrink-0 bg-slate-50 dark:bg-[#0a0a0a]">
            <button 
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 h-14 bg-white dark:bg-[#111111] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            >
              Terminate
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? "Broadcasting..." : "Establish Investment"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Investment Modal Overlay */}
      <Modal isOpen={showEditForm} onClose={closeEditForm} className="max-w-3xl">
        {/* Header - Sticky */}
        <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-500" /> Edit Record & Recalculate
          </h2>
          <button 
            onClick={closeEditForm}
            className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleEditInvestment} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] p-8 flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">Recalculation Notice</p>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  Modifying this entry will trigger a system-wide recalculation of the co-owner dues. An upward adjustment will increase the <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded ml-1">Pending Contributions</span> for all shareholders.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Total Investment (BDT)</label>
                <div className="relative h-14 group">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold text-xl group-focus-within:text-blue-500 transition-colors">৳</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    value={amountBDT}
                    onChange={(e) => setAmountBDT(e.target.value)}
                    className="w-full h-full bg-[#111111] border border-white/5 rounded-2xl pl-14 pr-6 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-lg font-mono placeholder:text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">USD Equivalent (Read-Only)</label>
                <div className="relative h-14">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-blue-500/40 font-bold text-xl">$</span>
                  </div>
                  <input 
                    type="text" 
                    readOnly
                    value={amountBDT && exchangeRate ? (parseFloat(amountBDT) / parseFloat(exchangeRate)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
                    className="w-full h-full bg-[#111111]/50 border border-white/5 rounded-2xl pl-14 pr-6 text-blue-500/60 outline-none font-mono text-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Exchange Rate (1$ = ?)</label>
                <div className="relative h-14 group">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold text-lg group-focus-within:text-blue-500 transition-colors">৳</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full h-full bg-[#111111] border border-white/5 rounded-2xl pl-14 pr-6 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Date of Entry</label>
                <div className="relative h-14 group">
                  <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="date" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-full bg-[#111111] border border-white/5 rounded-2xl pl-14 pr-6 text-white outline-none focus:border-blue-500/50 transition-all [color-scheme:dark] uppercase tracking-widest text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Note / Source (Mandatory Trace)</label>
              <textarea 
                value={note}
                required
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Rahul Roy Nipon - Private Cloud Server Injection"
                rows={2}
                className="w-full bg-[#111111] border border-white/5 rounded-2xl py-5 px-6 text-white outline-none focus:border-blue-500/50 transition-all resize-none text-sm placeholder:text-gray-700 font-medium"
              />
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="p-10 border-t border-slate-100 dark:border-white/5 flex gap-6 shrink-0 bg-slate-50 dark:bg-[#0a0a0a]">
            <button 
              type="button"
              onClick={closeEditForm}
              className="flex-1 h-14 bg-white dark:bg-[#111111] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            >
              Discard
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? "Updating..." : "Update Vault"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Investment Record"
        description="Are you absolutely sure you want to permanently delete this investment record? This action cannot be undone and will dispatch an alert to all Co-Founders."
        isDeleting={isDeleting}
      />
    </div>
  );
}
