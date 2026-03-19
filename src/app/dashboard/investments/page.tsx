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

  // Dynamic state loaded from DB
  const [dbCoFounders, setDbCoFounders] = useState<{_id: string, name: string}[]>([]);

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
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeframeFilter, setTimeframeFilter] = useState("ALL");
  const [founderFilter, setFounderFilter] = useState("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { socket } = useSocket();

  useEffect(() => {
    fetchCoFounders();
    fetchReports();
    fetchLiveExchangeRate().then(rate => setExchangeRate(rate.toString()));
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data on filter change
  useEffect(() => {
    fetchInvestments();
  }, [debouncedSearch, statusFilter, timeframeFilter, founderFilter, customStartDate, customEndDate]);

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

  const fetchCoFounders = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        const coFounders = data.filter(u => u.role === "CO_FOUNDER" || u.role === "SUPER_ADMIN");
        setDbCoFounders(coFounders);
      }
    } catch (err) {
      console.error("Failed to fetch founders", err);
    }
  };

  const fetchInvestments = async () => {
    setIsContentLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (timeframeFilter !== "ALL") params.append("timeframe", timeframeFilter);
      if (founderFilter !== "ALL") params.append("coOwnerId", founderFilter);
      if (timeframeFilter === "CUSTOM") {
        if (customStartDate) params.append("startDate", customStartDate);
        if (customEndDate) params.append("endDate", customEndDate);
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
          amountUSD: totalUSD,
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
        fetchInvestments();
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
          amountUSD: totalUSD,
          amountBDT: totalBDT,
          exchangeRate: rate,
          note,
          date,
        }),
      });

      if (res.ok) {
        closeEditForm();
        fetchInvestments();
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
        fetchInvestments(); // Refresh table
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
        fetchInvestments();
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

  const totalUSD = investments.reduce((sum, inv) => sum + inv.amountUSD, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Founder Investments</h1>
            <p className="text-gray-500 text-sm">Track capital injections from Rahul, Ashraful, and Saifur.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#141414] hover:bg-[#1c1c1c] border border-white/5 rounded-xl text-sm font-medium text-gray-300 transition-all">
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
          <div className="p-6 bg-gradient-to-br from-blue-600/10 to-blue-900/5 border border-blue-500/20 rounded-2xl relative overflow-hidden group shadow-lg shadow-blue-900/10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 relative z-10 text-center">Your Total Investment</p>
            <h3 className="text-2xl font-black text-white relative z-10 text-center">
              {formatCurrency(reportData.coFounderStats.totalInvestedBDT, "BDT")}
            </h3>
            <div className="text-[10px] text-blue-400/50 mt-2 font-black uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Aggregate Cleared
            </div>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-400/10 to-indigo-900/5 border border-blue-400/20 rounded-2xl relative overflow-hidden group shadow-lg shadow-indigo-900/10">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1 relative z-10 text-center">Your Pending Dues</p>
            <h3 className="text-2xl font-black text-white relative z-10 text-center">
              {formatCurrency(reportData.coFounderStats.totalPendingDuesBDT, "BDT")}
            </h3>
            <div className="text-[10px] text-blue-300/50 mt-2 font-black uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Owed to Quotex
            </div>
          </div>
        </div>
      )}

      {/* Founder Summary Cards - Visible to Admin and Co-Founders */}
      {["SUPER_ADMIN", "CO_FOUNDER"].includes(session?.user?.role as string) && reportData?.allCoFounderStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportData.allCoFounderStats.map((founder: any) => (
            <div key={founder.userId} className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all group/card">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0">
                  {founder.image ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover/card:border-blue-500 group-hover/card:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
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
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white group-hover/card:text-blue-400 transition-colors uppercase tracking-tight">{founder.name}</span>
                  <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Co-Founder</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 uppercase tracking-wider">Invested</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(founder.totalInvestedBDT, "BDT")}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 uppercase tracking-wider">Pending</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(founder.totalPendingDuesBDT, "BDT")}</span>
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
          value={totalUSD}
          icon={Wallet}
          themeColor="blue"
          description="Active Vault Balance"
          exchangeRate={parseFloat(exchangeRate) || 120}
        />
        
        <SummaryWidget 
          label="Cleared Funds (Received)"
          value={investments.reduce((sum, inv) => 
            sum + inv.contributions.reduce((cSum, c) => c.status === "CLEARED" ? cSum + c.amountUSD : cSum, 0)
          , 0)}
          icon={TrendingUp}
          themeColor="emerald"
          description="Actual paid capital"
          exchangeRate={parseFloat(exchangeRate) || 120}
        />
        
        <SummaryWidget 
          label="Pending Approvals (Owed)"
          value={investments.reduce((sum, inv) => 
            sum + inv.contributions.reduce((cSum, c) => c.status === "PENDING" ? cSum + c.amountUSD : cSum, 0)
          , 0)}
          icon={Clock}
          themeColor="amber"
          description="Awaiting founder transfer"
          exchangeRate={parseFloat(exchangeRate) || 120}
        />
      </div>

      {/* Investments Table Container */}
      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl shadow-sm overflow-visible">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-[#141414] border border-white/5 rounded-xl px-4 py-2.5 w-full max-w-md group focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-inner">
            <Search className={cn("w-4 h-4 transition-colors", searchTerm ? "text-primary" : "text-gray-500")} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search note, ID, or amount..." 
              className="bg-transparent text-sm text-white placeholder:text-gray-600 outline-none w-full font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="text-gray-600 hover:text-white transition-colors"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141414] border border-white/5 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-[#1c1c1c] min-w-[120px] text-center uppercase tracking-widest"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CLEARED">Cleared</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            {/* Timeframe Filter */}
            <select 
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value)}
              className="bg-[#141414] border border-white/5 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-[#1c1c1c] min-w-[140px] text-center uppercase tracking-widest"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="YTD">Year to Date</option>
              <option value="CUSTOM">Custom Range</option>
            </select>

            {/* Stakeholder Filter */}
            <select 
              value={founderFilter}
              onChange={(e) => setFounderFilter(e.target.value)}
              className="bg-[#141414] border border-white/5 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-[#1c1c1c] min-w-[160px] text-center uppercase tracking-widest"
            >
              <option value="ALL">All Founders</option>
              {dbCoFounders.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>

            {(searchTerm || statusFilter !== "ALL" || timeframeFilter !== "ALL" || founderFilter !== "ALL") && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setTimeframeFilter("ALL");
                  setFounderFilter("ALL");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-all font-black text-[10px] uppercase tracking-tighter"
                title="Clear All Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Picker - Animated Expansion */}
        {timeframeFilter === "CUSTOM" && (
          <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-center gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-500 uppercase">From:</span>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-[#141414] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50 [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-500 uppercase">To:</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-[#141414] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50 [color-scheme:dark]"
              />
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Investor Splits</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total (USD)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total (BDT)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Note</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {investments.length === 0 && !isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">No investment entries found.</td></tr>
              ) : (
                investments.map((inv) => (
                  <tr key={inv._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap text-center">
                      {formatDate(inv.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-center justify-center">
                        {inv.contributions.map((c, i) => {
                          const paid = c.paidAmountBDT || 0;
                          const target = c.amountBDT || 0;
                          const owed = Math.max(0, target - paid);
                          
                          return (
                          <div key={i} className="flex items-center gap-3 bg-[#111] p-1.5 rounded-lg border border-white/5 w-full max-w-sm justify-between">
                            <button
                              onClick={() => handleToggleStatus(inv._id, c.coOwner._id, c.status)}
                              disabled={session?.user?.role !== "SUPER_ADMIN" || c.status === "CLEARED"}
                              className={cn(
                                "w-20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all text-center border",
                                c.status === "CLEARED" 
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                  : "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 active:scale-95",
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
                                  <div className="w-8 h-8 rounded-full bg-[#111624] border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 group-hover:border-blue-500/50 transition-all">
                                    {c.coOwner.name.charAt(0)}
                                  </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#111] rounded-full" />
                              </div>
                              <span className="text-gray-300 text-xs font-black uppercase tracking-tight group-hover:text-white transition-colors">{c.coOwner.name}</span>
                            </div>
                            <div className="flex flex-col text-center w-28 pr-1">
                              <span className="text-white font-mono text-[11px] font-bold">
                                {c.status === "CLEARED" || owed === 0 
                                  ? "Paid: " + formatCurrency(target, "BDT") 
                                  : "Due: " + formatCurrency(owed, "BDT")}
                              </span>
                              {c.status === "PENDING" && paid > 0 && (
                                <span className="text-emerald-500/70 text-[9px] font-mono leading-tight">
                                  Paid: {formatCurrency(paid, "BDT")}
                                </span>
                              )}
                            </div>
                          </div>
                        )})}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 text-center">
                      {formatCurrency(inv.amountUSD, "USD")}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium text-center">
                      {formatCurrency(inv.amountBDT, "BDT")}
                      <div className="text-[10px] text-gray-500 mt-0.5">@ {inv.exchangeRate}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-xs text-center">
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


      {/* Add Investment Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Record New Investment
              </h2>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddInvestment} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Total Investment Amount (BDT)</span>
                  {amountBDT && exchangeRate && (
                    <span className="text-primary opacity-80 font-mono bg-[#141414] px-2 py-0.5 rounded border border-white/5">
                      ≈ ${(parseFloat(amountBDT) / parseFloat(exchangeRate)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">৳</span>
                  <input 
                    type="number" 
                    required 
                    value={amountBDT}
                    onChange={(e) => setAmountBDT(e.target.value)}
                    placeholder="e.g. 360000"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exchange Rate (1$ = ?)</label>
                  <input 
                    type="number" 
                    required 
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder="120"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="date" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Note / Reference</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Initial cloud server setup capital or Marketing budget"
                  rows={3}
                  className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  This transaction will be recorded in the central ledger under <span className="text-white font-medium">CREDIT (Investment)</span>. 
                  It will record a total required company investment of <span className="text-primary font-bold">
                    {parseFloat(amountBDT || "0").toLocaleString()} BDT
                  </span> resulting in 3 equal <span className="text-white font-medium">Pending</span> shares of <span className="text-primary font-bold">{(parseFloat(amountBDT || "0") / 3).toLocaleString(undefined, {maximumFractionDigits: 2})} BDT</span> for each Co-Founder.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 px-4 bg-[#1c1c1c] hover:bg-[#252525] border border-white/5 rounded-xl text-sm font-semibold text-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Processing..." : "Confirm Investment"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Investment Modal Overlay */}
      {showEditForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-500" /> Edit Record & Recalculate
              </h2>
              <button 
                onClick={closeEditForm}
                className="text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditInvestment} className="p-6 space-y-5">
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg mb-4">
                <p className="text-xs text-blue-400 leading-relaxed">
                  <span className="font-bold">Recalculation Notice:</span> Upward amount adjustments will seamlessly distribute the delta into "Pending" dues for Co-Founders, locking previously "Cleared" funds.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Total Investment Amount (BDT)</span>
                  {amountBDT && exchangeRate && (
                    <span className="text-primary opacity-80 font-mono bg-[#141414] px-2 py-0.5 rounded border border-white/5">
                      ≈ ${(parseFloat(amountBDT) / parseFloat(exchangeRate)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-mono">৳</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountBDT}
                    onChange={(e) => setAmountBDT(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-white transition-all font-mono text-center tracking-wider"
                    placeholder="Enter total BDT..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Exchange Rate (1$ = ?)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-mono">৳</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-white transition-all font-mono text-center"
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-white transition-all text-center uppercase tracking-wider text-sm"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Note / Source (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-white transition-all text-center"
                  placeholder="e.g., Bank Transfer, Wise..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4 transition-transform group-hover:scale-110" />
                  {isSubmitting ? "Updating..." : "Update Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
