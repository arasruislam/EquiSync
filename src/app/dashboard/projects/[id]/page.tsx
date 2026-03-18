"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Percent,
  TrendingUp,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldCheck,
  Edit2
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Share Management State
  const [editingShare, setEditingShare] = useState<string | null>(null);
  const [sharePercent, setSharePercent] = useState("");
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        router.push("/dashboard/projects");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateShare = async (memberId: string) => {
    setIsUpdatingShare(true);
    try {
      const res = await fetch(`/api/projects/${id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          sharePercent: parseFloat(sharePercent),
        }),
      });
      if (res.ok) {
        setEditingShare(null);
        fetchProjectData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingShare(false);
    }
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Clock className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!data) return null;

  const { project, shares } = data;
  const totalAllocated = shares.reduce((sum: number, s: any) => sum + s.sharePercent, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Breadcrumbs & Simple Actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/projects" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Pipeline
        </Link>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border",
                project.status === "ACTIVE" ? "text-blue-500 bg-blue-500/10 border-blue-500/20" : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
              )}>
                {project.status}
              </div>
            </div>
            
            <div className="space-y-6 relative">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-primary text-sm font-bold uppercase tracking-tighter">
                  <Briefcase className="w-4 h-4" />
                  Project Mandate
                </div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">{project.title}</h1>
                <p className="text-gray-500 text-lg flex items-center gap-2">
                   {project.clientName || "Direct Client Engagement"}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Value</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(project.totalValueUSD)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Start Date</p>
                  <p className="text-xl font-bold text-white">{formatDate(project.startDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Team Size</p>
                  <p className="text-xl font-bold text-white">{project.assignedTo.length} Members</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Manager</p>
                  <p className="text-xl font-bold text-white truncate">{project.managedBy?.name.split(" ")[0] || "None"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-primary" /> Team & Revenue Allocation
            </h2>
            
            <div className="space-y-4">
              {project.assignedTo.map((member: any) => {
                const share = shares.find((s: any) => s.member._id === member._id);
                const isEditing = editingShare === member._id;

                return (
                  <div key={member._id} className="group p-5 bg-[#141414]/50 border border-white/5 rounded-2xl hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{member.name}</h4>
                        <p className="text-xs text-gray-500 uppercase font-black tracking-tighter">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Estimated Payout</span>
                        <span className="text-lg font-black text-white">{formatCurrency(share?.shareAmountUSD || 0)}</span>
                        <span className="text-[10px] text-gray-600">~ {formatCurrency(share?.shareAmountBDT || 0, "BDT")}</span>
                      </div>

                      <div className="w-[120px]">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              autoFocus
                              value={sharePercent}
                              onChange={(e) => setSharePercent(e.target.value)}
                              className="w-full bg-black border border-primary/50 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none"
                            />
                            <button 
                              disabled={isUpdatingShare}
                              onClick={() => handleUpdateShare(member._id)}
                              className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center justify-between gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:border-primary/50 transition-all group/share"
                            onClick={() => {
                              if (session?.user?.role === "CO_FOUNDER") {
                                setEditingShare(member._id);
                                setSharePercent(share?.sharePercent?.toString() || "0");
                              }
                            }}
                          >
                            <span className="text-sm font-bold text-primary">{share?.sharePercent || 0}%</span>
                            <Percent className="w-3.5 h-3.5 text-gray-600 group-hover/share:text-primary transition-colors" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalAllocated > 0 && (
              <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Consolidated Team Allocation</p>
                    <p className="text-xs text-gray-500">Total percentage of project value assigned to members.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{totalAllocated}%</p>
                   <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Of Mandate Value</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Project Ledger Overview</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#141414] rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-300">Net Profit Share</span>
                </div>
                <span className="text-sm font-bold text-emerald-500">100%</span>
              </div>
              <div className="p-4 bg-[#141414] rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-300">Audit Status</span>
                </div>
                <span className="text-sm font-bold text-orange-500">Verified</span>
              </div>
            </div>
            
            <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-semibold text-white border border-white/10 transition-all">
              Generate Financial Report
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-primary rounded-3xl p-6 text-white shadow-2xl shadow-primary/20">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" /> Business Rule
            </h3>
            <p className="text-sm opacity-90 leading-relaxed font-medium">
              Revenue shares are calculated based on the project Mandate value. 
              Payouts can only be processed once Fiverr income for this project hits "WITHDRAWN" status.
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <button className="text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Learn about allocation limits <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
