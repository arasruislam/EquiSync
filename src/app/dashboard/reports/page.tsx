"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Users,
  Download,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { SummaryWidget } from "@/components/dashboard/SummaryWidget";
import { exportToPDF, exportToCSV } from "@/lib/export-utils";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import AnalyticsGraph from "@/components/dashboard/AnalyticsGraph";
import ResourcePieChart from "@/components/dashboard/ResourcePieChart";

interface Summary {
  totalInvestments: number;
  totalInvestmentsBDT: number;
  clearedInvestmentsUSD: number;
  clearedInvestmentsBDT: number;
  totalFiverrGreen: number;
  totalFiverrWithdrawn: number;
  totalPayouts: number;
  totalExpenses: number;
  totalExpensesBDT: number;
  companyBalance: number;
  companyBalanceBDT: number;
  ytdExpense: number;
  ytdExpenseBDT: number;
  totalPendingDuesUSD: number;
  totalPendingDuesBDT: number;
}

interface CoFounderStat {
  userId: string;
  name: string;
  image?: string;
  totalInvestedBDT: number;
  totalPendingDuesBDT: number;
}

interface ReportsData {
  summary: Summary;
  monthlyData: any[];
  coFounderStats: CoFounderStat | null;
  allCoFounderStats: CoFounderStat[] | null;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setIsContentLoading(true);
    try {
      const res = await fetch("/api/reports");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };

  if (!data && isLoading) return null;
  if (!data) return null;

  const { summary, monthlyData, allCoFounderStats, coFounderStats } = data;

  const handleExportPDF = () => {
    const headers = ["Metric", "Value", "Context"];
    const exportData = [
      ["Available Liquid Balance", formatCurrency(summary.companyBalance), "Central Vault"],
      ["Fiverr Green (Pending)", formatCurrency(summary.totalFiverrGreen), "Market Inflow"],
      ["Member Payouts", formatCurrency(summary.totalPayouts), "Disbursements"],
      ["Operating Expenses", formatCurrency(summary.totalExpenses), "SaaS & Office"],
      ["Founder Capital", formatCurrency(summary.totalInvestments), "Total Inflow"],
      ["Client Revenue", formatCurrency(summary.totalFiverrWithdrawn), "Withdrawn"]
    ];

    if (allCoFounderStats) {
      allCoFounderStats.forEach(f => {
        exportData.push([`Equity: ${f.name}`, formatCurrency(f.totalInvestedBDT, "BDT"), "Total Share"]);
      });
    }

    exportToPDF("Executive Financial Summary", headers, exportData, `QuoteX_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportCSV = () => {
    const exportData = [
      { Metric: "Available Liquid Balance", Value: summary.companyBalance, Unit: "USD" },
      { Metric: "Fiverr Green (Pending)", Value: summary.totalFiverrGreen, Unit: "USD" },
      { Metric: "Member Payouts", Value: summary.totalPayouts, Unit: "USD" },
      { Metric: "Operating Expenses", Value: summary.totalExpenses, Unit: "USD" },
      { Metric: "Founder Capital", Value: summary.totalInvestments, Unit: "USD" },
      { Metric: "Client Revenue", Value: summary.totalFiverrWithdrawn, Unit: "USD" }
    ];

    if (allCoFounderStats) {
      allCoFounderStats.forEach(f => {
        exportData.push({ 
          Metric: `Equity: ${f.name}`, 
          Value: f.totalInvestedBDT, 
          Unit: "BDT" 
        });
      });
    }

    exportToCSV(exportData, `QuoteX_Data_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Business Intelligence</h1>
            <p className="text-slate-400 dark:text-gray-500 text-sm transition-colors duration-300">High-level financial summaries and performance trends.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all uppercase tracking-widest shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-600/20 rounded-xl text-[10px] font-black text-blue-600 dark:text-blue-500 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest shadow-sm dark:shadow-blue-500/5"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 shadow-sm transition-all duration-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Real-Time Data Audited</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryWidget 
          label="Total Balance"
          amountBDT={summary.companyBalanceBDT}
          amountUSD={summary.companyBalance}
          icon={Wallet}
          themeColor="emerald"
          description="Liquid Central Vault"
        />
        <SummaryWidget 
          label="YTD Operating Expense"
          amountBDT={summary.ytdExpenseBDT}
          amountUSD={summary.ytdExpense}
          icon={TrendingDown}
          themeColor="red"
          description="Year-to-Date Outflow"
        />
        <SummaryWidget 
          label="Total Pending Dues"
          amountBDT={summary.totalPendingDuesBDT}
          amountUSD={summary.totalPendingDuesUSD}
          icon={Info}
          themeColor="amber"
          description="Market Commitment"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 overflow-hidden bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl shadow-xl dark:shadow-none transition-all duration-300">
          <AnalyticsGraph />
        </div>

        {/* Resource Allocation Breakdown */}
        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl p-8 space-y-8 flex flex-col justify-between shadow-xl dark:shadow-none transition-all duration-300">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">Resource Allocation</h3>
            
            <ResourcePieChart 
              data={[
                ...(data.allCoFounderStats || (data.coFounderStats ? [data.coFounderStats] : [])).map((founder: any) => {
                  const nameLower = founder.name.toLowerCase();
                  let color = "#10b881";
                  let glow = "rgba(16, 184, 129, 0.5)";

                  if (nameLower.includes("rahul")) {
                    color = "#8b5cf6";
                    glow = "rgba(139, 92, 246, 0.5)";
                  } else if (nameLower.includes("ashraful")) {
                    color = "#06b6d4";
                    glow = "rgba(6, 182, 212, 0.5)";
                  } else if (nameLower.includes("saifur")) {
                    color = "#f59e0b";
                    glow = "rgba(245, 158, 11, 0.5)";
                  }

                  return {
                    name: founder.name.split(" ")[0],
                    value: founder.totalInvestedBDT,
                    color,
                    glow
                  };
                }),
                { name: "Global Rev", value: summary.totalFiverrWithdrawn * 120, color: "#10b981", glow: "rgba(16, 185, 129, 0.5)" },
                { name: "Direct Cost", value: (summary.totalPayouts + summary.totalExpenses) * 120, color: "#ef4444", glow: "rgba(239, 68, 68, 0.5)" }
              ]}
            />

            <div className="space-y-5">
              {/* Individual Co-Founder Resource Contribution */}
              {(data.allCoFounderStats || (data.coFounderStats ? [data.coFounderStats] : [])).map((founder: any, i: number) => {
                const nameLower = founder.name.toLowerCase();
                let color = "#10b981";
                if (nameLower.includes("rahul")) color = "#8b5cf6";
                else if (nameLower.includes("ashraful")) color = "#06b6d4";
                else if (nameLower.includes("saifur")) color = "#f59e0b";

                return (
                <div key={founder.userId} className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-center">
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full overflow-hidden border shrink-0 transition-colors" style={{ borderColor: `${color}4D` }}>
                        {founder.image ? (
                          <Image src={founder.image} alt={founder.name} width={20} height={20} className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[7px] font-bold" style={{ backgroundColor: `${color}1A`, color: color }}>
                            {founder.name[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-400 dark:text-gray-400 transition-colors">{founder.name.split(" ")[0]} Capital</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-mono flex items-center gap-1.5 transition-colors">
                      {formatCurrency(founder.totalInvestedBDT, "BDT")}
                      <span className="text-[7px] text-slate-400 dark:text-gray-500 font-bold opacity-60">
                        ({formatCurrency(founder.totalInvestedBDT / 120, "USD")})
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                          style={{ 
                            width: `${(founder.totalInvestedBDT / (summary.totalInvestmentsBDT + (summary.totalFiverrWithdrawn * 120) + (summary.totalPayouts * 120) + summary.totalExpensesBDT)) * 100}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}1A`
                          }} 
                        />
                  </div>
                </div>
              )})}

              {[
                { label: "Global Revenue", value: summary.totalFiverrWithdrawn, color: "#10b981", bgClass: "bg-[#10b981]" },
                { label: "Direct Costs", value: summary.totalPayouts + summary.totalExpenses, color: "#ef4444", bgClass: "bg-[#ef4444]" }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400 dark:text-gray-500 transition-colors">{item.label}</span>
                    <span className="text-slate-900 dark:text-white font-mono flex items-center gap-1.5 transition-colors">
                      {formatCurrency(item.value * 120, "BDT")}
                      <span className="text-[7px] text-slate-400 dark:text-gray-500 font-bold opacity-60">
                        ({formatCurrency(item.value, "USD")})
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000 ease-out", item.bgClass)} 
                      style={{ 
                        width: `${(item.value * 120 / (summary.totalInvestmentsBDT + (summary.totalFiverrWithdrawn * 120) + (summary.totalPayouts * 120) + summary.totalExpensesBDT)) * 100}%`,
                        boxShadow: `0 0 10px ${item.color}1A`
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-white/5">
            <Link 
              href="/dashboard/activity"
              className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-all w-full shadow-sm"
            >
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-500">
                   <Layers className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-semibold text-slate-700 dark:text-gray-300 transition-colors">Detailed Audit</span>
               </div>
               <ChevronRight className="w-4 h-4 text-slate-400 dark:text-gray-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Founder Equity Section */}
      {(data.allCoFounderStats || data.coFounderStats) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
              <Users className="w-5 h-5 text-primary" />
              Founder Equity Matrix
            </h2>
            <Link href="/dashboard/investments" className="text-[10px] font-black text-slate-400 dark:text-gray-500 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1">
              Contribution Ledger <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(data.allCoFounderStats || (data.coFounderStats ? [data.coFounderStats] : [])).map((founder: any) => (
              <div key={founder.userId} className="p-6 bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-3xl relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl dark:shadow-blue-900/5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex items-center gap-4 mb-6 relative">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-primary/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-primary font-black text-xl overflow-hidden group-hover:scale-105 transition-transform duration-500 shadow-sm">
                    {founder.image ? (
                      <Image 
                        src={founder.image} 
                        alt={founder.name} 
                        width={56} 
                        height={56} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      founder.name[0]
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">{founder.name}</h4>
                    <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] transition-colors">Stakeholder</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative">
                  <div className="p-3 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl shadow-inner transition-colors">
                    <p className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-1">Total Share</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 transition-colors">{formatCurrency(founder.totalInvestedBDT, "BDT")}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl shadow-inner transition-colors">
                    <p className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-1">Commitment</p>
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400 transition-colors">{formatCurrency(founder.totalPendingDuesBDT, "BDT")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
