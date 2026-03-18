"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BarChart3, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Calendar,
  Layers,
  Clock,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  HandCoins,
  TrendingUp
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";

interface Transaction {
  _id: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amountUSD: number;
  amountBDT: number;
  description: string;
  date: string;
  createdBy: { name: string };
}

export default function LedgerPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterDir, setFilterDir] = useState("");
  const { setIsContentLoading } = useGlobalLoading();

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterDir]);

  const fetchTransactions = async () => {
    setIsContentLoading(true);
    try {
      const res = await fetch(`/api/ledger?type=${filterType}&direction=${filterDir}`);
      const data = await res.json();
      if (Array.isArray(data)) setTransactions(data);
    } catch (err) { console.error(err); }
    finally { 
      setIsLoading(false); 
      setIsContentLoading(false);
    }
  };

  const netBalanceUSD = transactions.reduce((acc, t) => 
    t.direction === "CREDIT" ? acc + t.amountUSD : acc - t.amountUSD, 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Central Ledger</h1>
            <p className="text-gray-500 text-sm">Unified immutable record of all financial movements.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          <Download className="w-4 h-4" /> Export Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-[#050B18] border border-white/5 rounded-3xl relative overflow-hidden group shadow-xl shadow-blue-900/5">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Company Capital Reserve</p>
          <h3 className="text-3xl font-black text-white">{formatCurrency(netBalanceUSD)}</h3>
          <p className="text-[10px] text-gray-600 font-bold mt-2 flex items-center gap-1 uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Audited Integrity
          </p>
        </div>
        <div className="p-8 bg-[#050B18] border border-white/5 rounded-3xl relative overflow-hidden group shadow-xl shadow-blue-900/5">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <HandCoins className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Verified Revenue</p>
          <h3 className="text-3xl font-black text-blue-500">
            {formatCurrency(transactions.filter(t => t.direction === "CREDIT").reduce((a, b) => a + b.amountUSD, 0))}
          </h3>
          <p className="text-[10px] text-gray-600 font-bold mt-2 uppercase tracking-widest">Lifetime Volume</p>
        </div>
        <div className="p-8 bg-[#050B18] border border-white/5 rounded-3xl relative overflow-hidden group shadow-xl shadow-blue-900/5">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-12 h-12 text-rose-500" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Corporate Expense</p>
          <h3 className="text-3xl font-black text-rose-500">
            {formatCurrency(transactions.filter(t => t.direction === "DEBIT").reduce((a, b) => a + b.amountUSD, 0))}
          </h3>
          <p className="text-[10px] text-gray-600 font-bold mt-2 uppercase tracking-widest">Incurred Costs</p>
        </div>
      </div>

      <div className="bg-[#050B18] border border-white/5 rounded-3xl overflow-hidden shadow-xl shadow-blue-900/5">
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-4 bg-white/[0.01]">
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-2 w-full max-w-xs">
            <Search className="w-4 h-4 text-gray-700" />
            <input type="text" placeholder="Filter descriptions..." className="bg-transparent text-sm text-white placeholder:text-gray-700 outline-none w-full font-medium" />
          </div>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50"
          >
            <option value="">All Types</option>
            <option value="INVESTMENT">Investments</option>
            <option value="FIVERR_INCOME">Fiverr Income</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="PAYOUT">Payouts</option>
            <option value="EXPENSE">Expenses</option>
          </select>

          <select 
            value={filterDir}
            onChange={(e) => setFilterDir(e.target.value)}
            className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50"
          >
            <option value="">All Flows</option>
            <option value="CREDIT">Inflow (+)</option>
            <option value="DEBIT">Outflow (-)</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Timeline</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Operation Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Category Trace</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Delta Magnitude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.length === 0 && !isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No historical movements matching criteria.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-white">{formatDate(t.date)}</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">By {t.createdBy?.name?.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm text-gray-300 font-bold uppercase tracking-tight max-w-md mx-auto truncate">{t.description}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full shadow-[0_0_8px]",
                          t.direction === "CREDIT" ? "bg-blue-500 shadow-blue-500/50" : "bg-rose-500 shadow-rose-500/50"
                        )} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{t.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className={cn(
                        "text-sm font-black tracking-widest flex items-center justify-center gap-1.5",
                        t.direction === "CREDIT" ? "text-blue-500" : "text-rose-500"
                      )}>
                        {t.direction === "CREDIT" ? "+" : "-"} {formatCurrency(t.amountUSD)}
                        {t.direction === "CREDIT" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">~ {formatCurrency(t.amountBDT, "BDT")}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Full Transparency & Audit Trail</p>
            <p className="text-xs text-gray-500">All ledger entries are linked to source documents and cannot be edited or deleted without co-founder approval.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
