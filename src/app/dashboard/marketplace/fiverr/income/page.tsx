"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Calendar,
  Layers
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { SummaryWidget } from "@/components/dashboard/SummaryWidget";

interface IncomeRecord {
  _id: string;
  type: "GREEN" | "WITHDRAWN";
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  orderId?: string;
  clientName?: string;
  projectRef?: { title: string };
  date: string;
  note?: string;
}

export default function FiverrIncomePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"GREEN" | "WITHDRAWN">("GREEN");
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [amountUSD, setAmountUSD] = useState("");
  const [exchangeRate, setExchangeRate] = useState("120");
  const [orderId, setOrderId] = useState("");
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/marketplace/fiverr/income?type=${activeTab}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const usd = parseFloat(amountUSD);
    const rate = parseFloat(exchangeRate);

    try {
      const res = await fetch("/api/marketplace/fiverr/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          amountUSD: usd,
          amountBDT: usd * rate,
          exchangeRate: rate,
          orderId,
          clientName,
          date,
          note,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setAmountUSD("");
        setOrderId("");
        setClientName("");
        setNote("");
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUSD = records.reduce((sum, r) => sum + r.amountUSD, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Fiverr Income Tracking</h1>
            <p className="text-gray-500 text-sm">Monitor pending green income and cleared bank-ready funds.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {["SUPER_ADMIN", "PROJECT_MANAGER", "LEADER"].includes(session?.user?.role || "") && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Record {activeTab === "GREEN" ? "Green" : "Cleared"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#050B18] border border-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("GREEN")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === "GREEN" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:text-gray-300"
          )}
        >
          <Clock className="w-4 h-4" />
          Pending
        </button>
        <button
          onClick={() => setActiveTab("WITHDRAWN")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === "WITHDRAWN" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:text-gray-300"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          Cleared
        </button>
      </div>

      {/* Summary Card */}
      <SummaryWidget 
        label={`Aggregate ${activeTab === "GREEN" ? "Pending Green" : "Cleared Bank"} Volume`}
        value={totalUSD}
        icon={activeTab === "GREEN" ? Clock : CheckCircle2}
        themeColor={activeTab === "GREEN" ? "amber" : "emerald"}
        description={`${records.length} Micro-Transfers`}
        exchangeRate={120}
      />

      {/* Table */}
      <div className="bg-[#050B18] border border-white/5 rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-2 w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-700" />
            <input 
              type="text" 
              placeholder="Filter ecosystem traces..." 
              className="bg-transparent text-sm text-white placeholder:text-gray-700 outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Reference</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Project</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Net (USD)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1, 2, 3].map((i) => <tr key={i} className="animate-pulse h-16"><td colSpan={5} className="px-6 bg-white/[0.01]" /></tr>)
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No {activeTab.toLowerCase()} income records found.</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap text-center font-medium">{formatDate(r.date)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-white uppercase tracking-tighter">{r.orderId || "Direct"}</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{r.clientName || "Global Market"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-black uppercase tracking-widest bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10 mx-auto w-fit">
                        <Layers className="w-3 h-3 text-blue-500" />
                        {r.projectRef?.title || "Operational"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors tracking-widest">{formatCurrency(r.amountUSD, "USD")}</span>
                          <ArrowUpRight className={cn("w-3.5 h-3.5", activeTab === "GREEN" ? "text-emerald-500 opacity-50" : "text-blue-500")} />
                        </div>
                        <p className="text-[10px] text-gray-600 font-bold">~ {formatCurrency(r.amountBDT, "BDT")}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-gray-700 hover:text-blue-400 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" /> Record {activeTab === "GREEN" ? "Green" : "Cleared"} Income
              </h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleAddIncome} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Order Value ($)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-500" />
                    <input type="number" required value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)} placeholder="0.00" className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-2.5 pl-10 text-white outline-none focus:border-emerald-500/50" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Rate (1$ = ?)</label>
                  <input type="number" required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-2.5 px-4 text-white outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Fiverr Order ID</label>
                <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="FO123ABC..." className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-2.5 px-4 text-white outline-none focus:border-emerald-500/50 uppercase" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Client Name</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="John Doe" className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-2.5 px-4 text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Order Date</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-2.5 px-4 text-white outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Notes</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-2.5 px-4 text-white outline-none focus:border-emerald-500/50 resize-none" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 bg-[#1c1c1c] hover:bg-[#252525] rounded-xl text-sm font-semibold text-gray-400">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-[#0a0a0a] font-bold rounded-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? "Saving..." : `Record ${activeTab === "GREEN" ? "Green" : "Cleared"} Income`}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

