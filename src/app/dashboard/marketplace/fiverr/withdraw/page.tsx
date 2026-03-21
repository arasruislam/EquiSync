"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Plus, 
  Search, 
  ArrowDownToLine, 
  Trash2, 
  CreditCard, 
  Building2, 
  Smartphone, 
  Globe,
  ChevronRight,
  Calendar,
  DollarSign,
  Receipt
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

interface WithdrawalRecord {
  _id: string;
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  method: string;
  reference?: string;
  date: string;
  note?: string;
}

export default function FiverrWithdrawalsPage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<WithdrawalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [amountUSD, setAmountUSD] = useState("");
  const [exchangeRate, setExchangeRate] = useState("120");
  const [method, setMethod] = useState("PAYONEER");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/marketplace/fiverr/withdraw");
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

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const usd = parseFloat(amountUSD);
    const rate = parseFloat(exchangeRate);

    try {
      const res = await fetch("/api/marketplace/fiverr/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUSD: usd,
          amountBDT: usd * rate,
          exchangeRate: rate,
          method,
          reference,
          date,
          note,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setAmountUSD("");
        setReference("");
        setNote("");
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (m: string) => {
    switch (m) {
      case "PAYONEER": return <Globe className="w-4 h-4" />;
      case "WISE": return <CreditCard className="w-4 h-4" />;
      case "BKASH": return <Smartphone className="w-4 h-4" />;
      case "BANK_TRANSFER": return <Building2 className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const totalUSD = records.reduce((sum, r) => sum + r.amountUSD, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500 transition-colors duration-300">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Fiverr Withdrawals</h1>
            <p className="text-slate-400 dark:text-gray-500 text-sm transition-colors duration-300">Track funds pulled from Fiverr into company bank accounts.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session?.user?.role === "SUPER_ADMIN" && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Withdrawal
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat */}
      <div className="p-8 bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl shadow-xl dark:shadow-none transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-400 dark:text-gray-500 transition-colors">Total Withdrawn Volume (Lifetime)</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">{formatCurrency(totalUSD)}</h3>
          </div>
          <div className="hidden sm:block">
            <div className="flex -space-x-3">
              {[Building2, Globe, Smartphone].map((Icon, i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#1c1c1c] border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center text-slate-400 dark:text-gray-500 shadow-sm transition-all hover:translate-y-[-2px] hover:z-10">
                  <Icon className="w-5 h-5" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-center text-slate-400 dark:text-gray-600 font-bold uppercase mt-3 tracking-widest transition-colors">Methods</p>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-none transition-all duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2 w-full max-w-sm transition-all shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="w-4 h-4 text-slate-400 dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by reference or note..." 
              className="bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-gray-600 outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] transition-colors">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center transition-colors">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center transition-colors">Method</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center transition-colors">Withdrawal Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center transition-colors">Reference</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-right transition-colors transition-colors">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
              {isLoading ? (
                [1, 2, 3].map((i) => <tr key={i} className="animate-pulse h-16"><td colSpan={5} className="px-6 bg-slate-50/20 dark:bg-white/[0.01]" /></tr>)
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-gray-500 italic transition-colors">No withdrawal records found.</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-400 whitespace-nowrap text-center font-medium transition-colors">{formatDate(r.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 justify-center">
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-400 group-hover:text-primary transition-all shadow-sm">
                          {getMethodIcon(r.method)}
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase transition-colors">{r.method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-slate-900 dark:text-white transition-colors">{formatCurrency(r.amountUSD, "USD")}</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-600 font-bold transition-colors">~ {formatCurrency(r.amountBDT, "BDT")} @ {r.exchangeRate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-400 font-mono tracking-tighter truncate max-w-[150px] transition-colors">
                      {r.reference || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-300 dark:text-gray-700 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} className="max-w-lg">
        <div className="bg-white dark:bg-[#141414] rounded-3xl overflow-hidden transition-all duration-300">
          <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Record Withdrawal</h2>
            <p className="text-slate-400 dark:text-gray-500 text-sm mt-1 transition-colors">Move funds from Fiverr balance to internal ledger.</p>
          </div>
          
          <form onSubmit={handleAddWithdrawal} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Amount ($)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input type="number" required value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-10 text-slate-900 dark:text-white outline-none focus:border-primary/50 text-lg font-black shadow-sm transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Exchange Rate</label>
                <input type="number" required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 font-medium shadow-sm transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Method</label>
                <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 appearance-none font-medium cursor-pointer transition-all shadow-sm"
                >
                  <option value="PAYONEER">Payoneer</option>
                  <option value="WISE">Wise</option>
                  <option value="BKASH">bkash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Reference / TXN ID</label>
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PAY-987-XYZ..." className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 font-mono tracking-tighter shadow-sm transition-all" />
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl p-4 flex gap-3 shadow-sm transition-all">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 h-fit shadow-sm">
                <ArrowDownToLine className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-gray-500 leading-relaxed italic transition-colors font-bold uppercase tracking-tight">
                Note: This withdrawal will decrease the recorded Fiverr pool balance and create a <span className="text-slate-900 dark:text-white font-black underline decoration-primary/30">DEBIT</span> entry in the ledger.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3.5 bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#252525] rounded-2xl text-sm font-semibold text-slate-400 dark:text-gray-400 transition-all shadow-sm">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] py-3.5 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group transition-all shadow-lg shadow-primary/20">
                {isSubmitting ? "Processing..." : "Confirm & Record"}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
