"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from "recharts";
import { useTheme } from "next-themes";
import { 
  TrendingUp, 
  TrendingDown,
  Maximize2,
  ShieldCheck
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import Image from "next/image";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";

const ranges = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "3 Months", value: "3month" },
  { label: "1 Year", value: "year" },
];

const staticSeriesConfig = [
  { key: "income", color: "#10b981", label: "Global Capital", glow: "rgba(16, 185, 129, 0.4)" }, // Emerald
  { key: "expense", color: "#ef4444", label: "Operating Expense", glow: "rgba(239, 68, 68, 0.4)" }, // Coral Red
];

const FOUNDER_COLORS: Record<string, { color: string, glow: string }> = {
  "650000000000000000000001": { color: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)" }, // Rahul (Purple)
  "650000000000000000000002": { color: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)" }, // Ashraful (Teal/Cyan)
  "650000000000000000000003": { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" }, // Saifur (Amber)
};

const DEFAULT_FOUNDER_COLOR = { color: "#10b981", glow: "rgba(16, 185, 129, 0.4)" };

export default function AnalyticsGraph() {
  const [data, setData] = useState<any[]>([]);
  const [range, setRange] = useState("month");
  const [activeSeries, setActiveSeries] = useState<string[]>(["income", "expense"]);
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();
  const [founderInfoMap, setFounderInfoMap] = useState<Record<string, any>>({});
  const { theme: currentTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setIsContentLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const result = await res.json();
      if (Array.isArray(result)) {
        const infoMap: Record<string, any> = {};
        const processed = result.map((d, index) => {
          const flattened = { ...d };
          if (d.inflows) {
            Object.entries(d.inflows).forEach(([id, info]: [any, any]) => {
              const key = `inflow_${id}`;
              flattened[key] = info.amount;
              infoMap[id] = info;
            });
          }
          
          // Add percentage change compared to previous data point
          if (index > 0) {
            const prev = result[index - 1];
            flattened.incomeChange = prev.income > 0 ? ((d.income - prev.income) / prev.income) * 100 : 0;
            flattened.expenseChange = prev.expense > 0 ? ((d.expense - prev.expense) / prev.expense) * 100 : 0;
          } else {
            flattened.incomeChange = 0;
            flattened.expenseChange = 0;
          }
          
          return flattened;
        });

        const inflowKeys = Object.keys(infoMap).map(id => `inflow_${id}`);
        setActiveSeries(prev => {
          const newKeys = inflowKeys.filter(k => !prev.includes(k));
          return Array.from(new Set([...prev, ...newKeys]));
        });

        setData(processed);
        setFounderInfoMap(infoMap);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };

  const toggleSeries = (key: string) => {
    setActiveSeries(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      // Determine the most relevant color for the border (first payload item)
      const primaryColor = payload[0]?.color || "#3b82f6";
      
      return (
        <div 
          className="bg-white/98 dark:bg-[#050B18]/95 border border-slate-100 dark:border-white/5 p-5 rounded-3xl shadow-2xl backdrop-blur-2xl z-50 min-w-[260px] transition-all duration-300"
          style={{ borderColor: `${primaryColor}40`, boxShadow: `0 10px 40px -10px ${primaryColor}20` }}
        >
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest leading-none">
              {format(date, "MMMM dd, yyyy")}
            </p>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: primaryColor, opacity: 0.5 }} />
          </div>
          
          <div className="space-y-4">
            {payload.map((p: any) => {
              const isFounder = p.dataKey.startsWith("inflow_");
              const founderId = isFounder ? p.dataKey.replace("inflow_", "") : null;
              const info = (founderId && founderInfoMap[founderId]) ? (founderInfoMap[founderId] as any) : null;
              
              const isIncome = p.dataKey === "income";
              const label = isFounder && info ? info.name : isIncome ? "Global Capital" : "Operating Expense";
              
              let color = p.color;
              if (isFounder && info) {
                const nameLower = info.name.toLowerCase();
                if (nameLower.includes("rahul")) color = "#8b5cf6";
                else if (nameLower.includes("ashraful")) color = "#06b6d4";
                else if (nameLower.includes("saifur")) color = "#f59e0b";
                else color = FOUNDER_COLORS[founderId]?.color || DEFAULT_FOUNDER_COLOR.color;
              }

              return (
                <div key={p.dataKey} className="group/item">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2.5">
                      {isFounder && info ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden border transition-colors duration-300" style={{ borderColor: `${color}40` }}>
                          {info.image ? (
                            <Image src={info.image} alt={info.name} width={24} height={24} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: `${color}20`, color: color }}>
                              {info.name[0]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color: color }} />
                      )}
                      <span className="text-[11px] font-bold text-slate-600 dark:text-gray-300 capitalize">
                        {label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-black text-slate-900 dark:text-white block leading-tight">
                        {formatCurrency(p.value * 120, "BDT")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 block opacity-80 italic">
                        ({formatCurrency(p.value, "USD")})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#050B18]/50 backdrop-blur-xl border border-slate-100 dark:border-white/10 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/20 transition-all duration-700 hover:border-blue-500/30 dark:hover:border-blue-500/30 group">
      {/* Header & Filters */}
      <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-500 group-hover:scale-110 group-hover:rotate-2 transition-all duration-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Financial Performance Analytics
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-[0.2em]">SaaS Business Intelligence Matrix</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-4">
          {/* Temporal range filter */}
          <div className="flex bg-slate-100 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-1 rounded-2xl shadow-inner text">
            {ranges.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border border-transparent ${
                  range === r.value 
                    ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 shadow-lg shadow-[#10b981]/10" 
                    : "text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-gray-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Series toggle filter */}
          <div className="flex bg-slate-100 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-1 rounded-2xl gap-1 shadow-inner">
            <div className="flex flex-wrap gap-4 items-center animate-in slide-in-from-bottom-2 duration-700">
              {staticSeriesConfig.map((s) => {
                const isActive = activeSeries.includes(s.key);
                return (
                <button
                  key={s.key}
                  onClick={() => toggleSeries(s.key)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all border outline-none group",
                    isActive
                      ? "bg-white dark:bg-white/[0.03] shadow-lg translate-y-[-1px]"
                      : "opacity-40 border-transparent hover:opacity-60"
                  )}
                  style={{ 
                    borderColor: isActive ? `${s.color}30` : 'transparent',
                    boxShadow: isActive ? `0 10px 20px -10px ${s.color}20` : 'none'
                  }}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full transition-all duration-500 group-hover:scale-125" 
                    style={{ 
                      backgroundColor: s.color,
                      boxShadow: isActive ? `0 0 12px ${s.glow}` : 'none'
                    }} 
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest leading-none transition-colors" style={{ color: isActive ? s.color : (currentTheme === 'light' ? '#64748b' : '#94a3b8') }}>
                    {s.key === "income" ? "Global Capital" : "Operating Expense"}
                  </span>
                </button>
              )})}

              {/* Founder Series Selectors */}
              {Object.entries(founderInfoMap).map(([id, info]: [any, any]) => {
                const nameLower = info.name.toLowerCase();
                let config = FOUNDER_COLORS[id] || DEFAULT_FOUNDER_COLOR;
                
                if (nameLower.includes("rahul")) config = FOUNDER_COLORS["650000000000000000000001"];
                else if (nameLower.includes("ashraful")) config = FOUNDER_COLORS["650000000000000000000002"];
                else if (nameLower.includes("saifur")) config = FOUNDER_COLORS["650000000000000000000003"];

                const key = `inflow_${id}`;
                const isActive = activeSeries.includes(key);
                
                return (
                  <button
                    key={id}
                    onClick={() => toggleSeries(key)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all border outline-none group",
                      isActive
                        ? "bg-white dark:bg-white/[0.03] shadow-lg translate-y-[-1px]"
                        : "opacity-40 border-transparent hover:opacity-60"
                    )}
                    style={{ 
                      borderColor: isActive ? `${config.color}30` : 'transparent',
                      boxShadow: isActive ? `0 10px 20px -10px ${config.color}20` : 'none'
                    }}
                  >
                    <div className="relative group/avatar">
                      {info.image ? (
                        <Image 
                          src={info.image} 
                          alt={info.name} 
                          width={20} 
                          height={20} 
                          className={cn(
                            "w-5 h-5 rounded-full object-cover transition-all duration-500",
                            isActive ? "grayscale-0 border-2" : "grayscale border-transparent"
                          )} 
                          style={{ borderColor: isActive ? config.color : 'transparent' }}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-black text-gray-500">
                          {info.name[0]}
                        </div>
                      )}
                      <div 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#050B18] transition-all duration-500"
                        style={{ 
                          backgroundColor: config.color,
                          transform: isActive ? 'scale(1.2)' : 'scale(1)',
                          boxShadow: isActive ? `0 0 8px ${config.color}` : 'none'
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none transition-colors" style={{ color: isActive ? config.color : (currentTheme === 'light' ? '#64748b' : '#94a3b8') }}>
                      {info.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Graph Body */}
      <div className="p-8 h-[450px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {/* Static Series Gradients */}
              <linearGradient id="colorincome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={staticSeriesConfig[0].color} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={staticSeriesConfig[0].color} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorexpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={staticSeriesConfig[1].color} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={staticSeriesConfig[1].color} stopOpacity={0}/>
              </linearGradient>

              {/* Dynamic Founder Inflow Gradients */}
              {Object.entries(founderInfoMap).map(([id, info]: [any, any]) => {
                const nameLower = info.name.toLowerCase();
                let config = FOUNDER_COLORS[id] || DEFAULT_FOUNDER_COLOR;
                if (nameLower.includes("rahul")) config = FOUNDER_COLORS["650000000000000000000001"];
                else if (nameLower.includes("ashraful")) config = FOUNDER_COLORS["650000000000000000000002"];
                else if (nameLower.includes("saifur")) config = FOUNDER_COLORS["650000000000000000000003"];
                
                return (
                  <linearGradient key={id} id={`colorInflow_${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={currentTheme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)"} vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: currentTheme === 'light' ? '#475569' : '#64748b', fontSize: 10, fontWeight: 800 }}
              tickFormatter={(val) => {
                const d = new Date(val);
                return range === "year" ? format(d, "MMM") : range === "today" ? format(d, "HH:mm") : format(d, "MMM dd");
              }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: currentTheme === 'light' ? '#475569' : '#64748b', fontSize: 10, fontWeight: 800 }}
              tickFormatter={(val) => `$${val}`}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            
            {/* Static Series Areas */}
            {staticSeriesConfig.map((s) => {
              const isActive = activeSeries.includes(s.key);
              const isHovered = hoveredSeries === s.key;
              const shouldDim = hoveredSeries && hoveredSeries !== s.key;

              return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.key === "income" ? "Global Capital" : "Operating Expense"}
                stroke={s.color}
                strokeWidth={isHovered ? 6 : 4}
                strokeOpacity={shouldDim ? 0.1 : 1}
                fillOpacity={shouldDim ? 0.05 : 1}
                fill={`url(#color${s.key})`}
                hide={!isActive}
                animationDuration={1500}
                onMouseEnter={() => setHoveredSeries(s.key)}
                onMouseLeave={() => setHoveredSeries(null)}
                activeDot={{ 
                  r: 8, 
                  stroke: s.color, 
                  strokeWidth: 4, 
                  fill: "white",
                  style: { filter: `drop-shadow(0 0 12px ${s.glow})`, opacity: shouldDim ? 0.3 : 1 } 
                }}
              />
            )})}

            {/* Founder Inflow Areas */}
            {Object.entries(founderInfoMap).map(([id, info]: [any, any]) => {
              const nameLower = info.name.toLowerCase();
              let config = FOUNDER_COLORS[id] || DEFAULT_FOUNDER_COLOR;
              if (nameLower.includes("rahul")) config = FOUNDER_COLORS["650000000000000000000001"];
              else if (nameLower.includes("ashraful")) config = FOUNDER_COLORS["650000000000000000000002"];
              else if (nameLower.includes("saifur")) config = FOUNDER_COLORS["650000000000000000000003"];

              const key = `inflow_${id}`;
              const isActive = activeSeries.includes(key);
              const isHovered = hoveredSeries === key;
              const shouldDim = hoveredSeries && hoveredSeries !== key;

              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={founderInfoMap[id].name}
                  stroke={config.color}
                  strokeWidth={isHovered ? 6 : 4}
                  strokeOpacity={shouldDim ? 0.1 : 1}
                  fillOpacity={shouldDim ? 0.05 : 1}
                  fill={`url(#colorInflow_${id})`}
                  hide={!isActive}
                  animationDuration={1500}
                  onMouseEnter={() => setHoveredSeries(key)}
                  onMouseLeave={() => setHoveredSeries(null)}
                  activeDot={{ 
                    r: 8, 
                    stroke: config.color, 
                    strokeWidth: 4, 
                    fill: "white",
                    style: { filter: `drop-shadow(0 0 12px ${config.glow})`, opacity: shouldDim ? 0.3 : 1 } 
                  }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="px-8 py-5 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Revenue Growth</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Operational Burn</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Profit Efficiency</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-blue-500/40">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Enterprise Analytics Active</span>
        </div>
      </div>
    </div>
  );
}
