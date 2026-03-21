"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Plus,
  ShieldCheck,
  TrendingDown,
  Activity,
  ArrowRight
} from "lucide-react";
import { formatCurrency, formatDate, cn, getAuditDescription } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/components/providers/SocketProvider";
import { fetchLiveExchangeRate } from "@/lib/exchange-rate";
import AnalyticsGraph from "@/components/dashboard/AnalyticsGraph";
import { SummaryWidget } from "@/components/dashboard/SummaryWidget";
import Image from "next/image";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { AuditDetailsModal } from "@/components/dashboard/AuditDetailsModal";
import { AuditTraceView } from "@/components/audit/AuditTraceView";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();
  const [exchangeRate, setExchangeRate] = useState(120);
  const { socket } = useSocket();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchLiveExchangeRate().then(setExchangeRate);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleInvalidate = () => fetchDashboardData();
    socket.on("invalidate-data", handleInvalidate);
    return () => {
      socket.off("invalidate-data", handleInvalidate);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    setIsContentLoading(true);
    try {
      const [reportsRes, projectsRes, ledgerRes, auditRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/projects"),
        fetch("/api/ledger"),
        fetch("/api/audit?limit=5")
      ]);

      const reports = await reportsRes.json();
      const projects = await projectsRes.json();
      const ledger = await ledgerRes.json();
      const audit = await auditRes.json(); // Safely pulls system-wide JSON tracing logs

      setData({
        summary: reports.summary || {},
        coFounderStats: reports.coFounderStats || null,
        allCoFounderStats: reports.allCoFounderStats || null,
        activeProjects: Array.isArray(projects) ? projects.slice(0, 5) : [],
        recentLedger: Array.isArray(ledger) ? ledger.slice(0, 5) : [],
        recentAudit: audit.logs || []
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };

  if (!data && isLoading) return null;

  const { summary, coFounderStats, allCoFounderStats, activeProjects, recentLedger, recentAudit } = data || {};

  const stats = [
    { 
      label: "Company Balance", 
      value: summary?.companyBalance || 0, 
      icon: DollarSign,
      themeColor: "blue" as const,
      description: "Liquid Central Vault"
    },
    { 
      label: "Monthly Income", 
      value: summary?.monthlyIncome || 0, 
      icon: TrendingUp,
      themeColor: "emerald" as const,
      description: "Marketplace Inflow"
    },
    { 
      label: "Monthly Expense", 
      value: summary?.monthlyExpense || 0, 
      icon: TrendingDown,
      themeColor: "red" as const,
      description: "Operational Burn"
    },
    { 
      label: "Global Dues", 
      value: summary?.totalPendingDuesUSD || 0, 
      icon: Clock,
      themeColor: "amber" as const,
      description: "Market Commitment"
    },
  ];

  const projectStats = [
    { label: "Active", count: summary?.projectStats?.ACTIVE || 0, color: "text-blue-600 dark:text-cyan-400", bg: "bg-blue-50 dark:bg-cyan-400/10" },
    { label: "Completed", count: summary?.projectStats?.COMPLETED || 0, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-400/10" },
    { label: "Canceled", count: summary?.projectStats?.CANCELLED || 0, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-400/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Welcome back, {session?.user?.name?.split(" ")[0]}</h1>
          <p className="text-slate-400 dark:text-gray-500 mt-1 transition-colors">Here's a live audit of QuoteXStudio's operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/ledger"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-xl text-sm font-semibold text-slate-700 dark:text-gray-300 transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            Audit Ledger
          </Link>
          {session?.user?.role === "SUPER_ADMIN" && (
            <Link 
              href="/dashboard/projects"
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <SummaryWidget 
            key={i}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            themeColor={stat.themeColor}
            description={stat.description}
            exchangeRate={exchangeRate}
          />
        ))}
      </div>

      {/* Project Status Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projectStats.map((stat, i) => (
          <div key={i} className="p-4 bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between shadow-xl dark:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full transition-colors", stat.bg)} />
              <span className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">{stat.label} Projects</span>
            </div>
            <span className={cn("text-xl font-black transition-colors", stat.color)}>{stat.count}</span>
          </div>
        ))}
      </div>


      {/* Co-Founder Individual BDT Ledger Highlight */}
      {session?.user?.role === "CO_FOUNDER" && coFounderStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryWidget 
            label="Your Total Investment"
            value={coFounderStats.totalInvestedBDT / (exchangeRate || 120)}
            icon={TrendingUp}
            themeColor="blue"
            description="Lifetime cleared shares"
            exchangeRate={exchangeRate || 120}
          />
          <SummaryWidget 
            label="Your Pending Dues"
            value={coFounderStats.totalPendingDuesBDT / (exchangeRate || 120)}
            icon={Clock}
            themeColor="amber"
            description="Owed investments & expenses"
            exchangeRate={exchangeRate || 120}
          />
        </div>
      )}

      {/* All Co-Founders Matrix - Visible to Admin and Co-Founders */}
      {["SUPER_ADMIN", "CO_FOUNDER"].includes(session?.user?.role as string) && allCoFounderStats && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white px-2 transition-colors">Co-Founder Matrix</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {allCoFounderStats.map((founder: any) => (
              <div key={founder.userId} className="min-w-[320px] p-6 bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl relative overflow-hidden group shadow-xl dark:shadow-none transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-primary/20 flex items-center justify-center text-primary font-bold text-lg overflow-hidden border border-slate-100 dark:border-white/10 shrink-0 transition-colors shadow-sm">
                    {founder.image ? (
                      <Image 
                        src={founder.image} 
                        alt={founder.name} 
                        width={40} 
                        height={40} 
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      founder.name[0]
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{founder.name}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-widest font-extrabold group-hover:text-slate-500 dark:group-hover:text-gray-400 transition-colors">Co-Founder</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-50 dark:border-white/5 pb-3 transition-colors">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">Total Invested</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 transition-colors">{formatCurrency(founder.totalInvestedBDT, "BDT")}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-600 font-mono mb-1 transition-colors">({formatCurrency(founder.totalInvestedBDT / (exchangeRate || 120), "USD")})</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">Pending Dues</p>
                      <p className="text-lg font-black text-rose-600 dark:text-rose-400 transition-colors">{formatCurrency(founder.totalPendingDuesBDT, "BDT")}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-600 font-mono mb-1 transition-colors">({formatCurrency(founder.totalPendingDuesBDT / (exchangeRate || 120), "USD")})</p>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                   <TrendingUp className="w-8 h-8 text-primary/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        {/* Projects Table Partial */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Active Projects</h2>
            <Link href="/dashboard/projects" className="text-xs font-bold text-primary hover:underline underline-offset-4 flex items-center gap-1 uppercase tracking-widest">
              Pipeline Overview <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-blue-900/5 transition-all">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] transition-colors">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Project Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Stakeholder</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Asset Value</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
                {activeProjects?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest italic transition-colors">No active projects found.</td></tr>
                ) : (
                  activeProjects?.map((project: any) => (
                    <tr key={project._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{project.title}</span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest text-center transition-colors">{project.clientName || "Direct"}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-black text-slate-900 dark:text-white transition-colors">{formatCurrency(project.totalValueUSD * exchangeRate, "BDT")}</div>
                        <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold group-hover:text-blue-600 dark:group-hover:text-blue-500/50 transition-colors">({formatCurrency(project.totalValueUSD, "USD")})</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/10 transition-all">
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Financial & Audit Stacks */}
        <div className="space-y-8 flex flex-col">
          {/* Financial Ledger Widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Financial Ledger</h2>
            </div>
            <div className="bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl dark:shadow-blue-900/5 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="space-y-6 relative">
                {recentLedger?.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-gray-600 text-sm italic py-8 transition-colors">No recent activity.</p>
                ) : (
                  recentLedger?.map((activity: any) => (
                    <div key={activity._id} className="flex gap-4 group">
                      <div className="relative">
                        <div className={cn(
                          "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all",
                          activity.direction === "CREDIT" ? "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-500" : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-500"
                        )}>
                          {activity.direction === "CREDIT" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className="space-y-0.5 py-0.5">
                        <p className="text-xs text-slate-700 dark:text-gray-300 font-bold uppercase tracking-tight leading-relaxed transition-colors">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 dark:text-gray-600 font-black uppercase tracking-widest transition-colors">{activity.type}</span>
                          <span className="text-[9px] text-slate-200 dark:text-gray-800">•</span>
                          <span className="text-[9px] text-slate-400 dark:text-gray-600 font-bold uppercase transition-colors">{formatDate(activity.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link 
                href="/dashboard/ledger"
                className="block w-full mt-8 py-3 bg-blue-50 dark:bg-blue-600/5 hover:bg-blue-100 dark:hover:bg-blue-600/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10 transition-all shadow-sm"
              >
                Full Ledger Analysis
              </Link>
            </div>
          </div>
          
          {/* Audit Trail Widget - COMPACT LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                <Activity className="w-5 h-5 text-blue-500" />
                Live Audit Trace
              </h2>
            </div>
            <div className="bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl dark:shadow-blue-900/5 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="space-y-6 relative">
                {recentAudit?.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-gray-600 text-sm italic py-8 font-medium transition-colors">No record mutations detected.</p>
                ) : (
                  recentAudit?.map((log: any) => (
                    <div key={log._id} className="flex gap-4 items-start relative p-2 rounded-2xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]" onClick={() => setSelectedLog(log)}>
                      <div className="relative shrink-0">
                        {log.actor?.image ? (
                          <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-blue-500/20 overflow-hidden bg-slate-100 dark:bg-blue-500/5 transition-all shadow-sm">
                            <Image 
                              src={log.actor.image} 
                              alt={log.actor.name || "Actor"} 
                              width={32} 
                              height={32} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-blue-500/20 bg-slate-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 flex items-center justify-center transition-all shadow-sm">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 py-0.5 w-full">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs text-slate-700 dark:text-gray-300 font-bold uppercase tracking-tight truncate max-w-[140px] transition-colors">
                            <strong className="text-slate-900 dark:text-white transition-colors">{log.actor?.name?.split(" ")[0]}</strong>: {log.action.replace(/_/g, " ")}
                          </p>
                          <span className="text-[8px] text-slate-400 dark:text-gray-600 font-mono italic transition-colors whitespace-nowrap">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-gray-500 font-medium leading-tight transition-colors">
                          {getAuditDescription(log.action, log.targetModel)}
                        </p>
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 dark:text-gray-600 font-black uppercase tracking-widest transition-colors">{log.targetModel}</span>
                            <span className="text-[9px] text-slate-200 dark:text-gray-800">•</span>
                            <span className="text-[9px] text-slate-400 dark:text-gray-700 font-bold uppercase truncate max-w-[80px] transition-colors">{log.targetId?.substring(0, 8) || "GLOBAL"}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="text-[8px] font-black text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-white transition-colors uppercase tracking-[0.2em]"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link 
                href="/dashboard/activity"
                className="block w-full mt-8 py-3 bg-blue-50 dark:bg-blue-600/5 hover:bg-blue-100 dark:hover:bg-blue-600/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10 transition-all font-black shadow-sm"
              >
                Go to System Audit
              </Link>
            </div>
          </div>

          {/* Details Modal Integration */}
          {selectedLog && (
            <AuditDetailsModal 
              log={selectedLog}
              onClose={() => setSelectedLog(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
