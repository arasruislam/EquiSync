"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { 
  Plus, 
  Search, 
  Briefcase, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  ChevronRight,
  MoreVertical,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { Modal } from "@/components/ui/Modal";

interface Project {
  _id: string;
  title: string;
  clientName?: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  totalValueUSD: number;
  totalValueBDT: number;
  exchangeRate: number;
  startDate: string;
  assignedTo: Array<{ _id: string; name: string; role: string; image?: string }>;
  managedBy?: { _id: string; name: string; image?: string };
  tags: string[];
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [totalValueUSD, setTotalValueUSD] = useState("");
  const [exchangeRate, setExchangeRate] = useState("120");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [managedBy, setManagedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    setIsContentLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const usd = parseFloat(totalValueUSD);
    const rate = parseFloat(exchangeRate);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientName,
          totalValueUSD: usd,
          totalValueBDT: usd * rate,
          exchangeRate: rate,
          startDate,
          managedBy: managedBy || session?.user?.id,
          assignedTo,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setTitle("");
        setClientName("");
        setTotalValueUSD("");
        setAssignedTo([]);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20";
      case "COMPLETED": return "text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20";
      case "ON_HOLD": return "text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20";
      case "CANCELLED": return "text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20";
      default: return "text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-gray-500/10 border-slate-100 dark:border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Project Pipeline</h1>
            <p className="text-slate-400 dark:text-gray-500 text-sm transition-colors duration-300">Manage client mandates, team assignments, and revenue targets.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {["SUPER_ADMIN", "PROJECT_MANAGER", "LEADER"].includes(session?.user?.role || "") && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Launch Project
            </button>
          )}
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 animate-pulse shadow-sm" />
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 border-dashed rounded-3xl shadow-sm transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 transition-colors">
              <Briefcase className="w-8 h-8 text-slate-300 dark:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">No projects found</h3>
            <p className="text-slate-400 dark:text-gray-500 mt-1 transition-colors">Start by creating your first project pipeline.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="group bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col shadow-xl dark:shadow-blue-900/5 duration-300">
              <div className="flex justify-center mb-4">
                <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", getStatusColor(project.status))}>
                   {project.status === "ACTIVE" ? "Operational" : project.status}
                </div>
              </div>

              <div className="flex-1 text-center">
                <Link href={`/dashboard/projects/${project._id}`} className="block group/link">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors uppercase tracking-tight">{project.title}</h3>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-2 flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-colors">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    {project.clientName || "Direct Client"}
                  </p>
                </Link>

                <div className="mt-8 space-y-4 bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                  <div className="flex flex-col items-center justify-center gap-1 text-xs transition-colors">
                    <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-500" /> Valuation
                    </span>
                    <span className="text-slate-900 dark:text-white font-black transition-colors">{formatCurrency(project.totalValueUSD)}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 text-xs transition-colors">
                    <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       <Clock className="w-3 h-3 text-blue-600 dark:text-blue-500" /> Timeline
                    </span>
                    <span className="text-slate-600 dark:text-gray-400 font-bold transition-colors">{formatDate(project.startDate)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between transition-colors">
                <div className="flex -space-x-2">
                  {project.assignedTo.slice(0, 3).map((user) => (
                    <div 
                      key={user._id} 
                      title={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-[#050B18] overflow-hidden bg-slate-100 dark:bg-[#1c1c1c] flex items-center justify-center shrink-0 shadow-sm transition-all"
                    >
                      {user.image ? (
                        <Image 
                          src={user.image} 
                          alt={user.name} 
                          width={32} 
                          height={32} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 transition-colors uppercase">{user.name.charAt(0)}</span>
                      )}
                    </div>
                  ))}
                  {project.assignedTo.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0f0f0f] bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm transition-all">
                      +{project.assignedTo.length - 3}
                    </div>
                  )}
                </div>
                <Link 
                  href={`/dashboard/projects/${project._id}`}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Project Modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} className="max-w-2xl">
        <div className="bg-white dark:bg-[#141414] rounded-3xl overflow-hidden transition-all duration-300">
          <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Create New Project</h2>
              <p className="text-slate-400 dark:text-gray-500 text-sm mt-1 transition-colors">Define scope, value, and assemble your team.</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full shadow-sm">
              ✕
            </button>
          </div>
          
          <form onSubmit={handleCreateProject} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Project Title</label>
              <input 
                type="text" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next.js SaaS Platform Development"
                className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 text-lg font-medium shadow-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Client Name</label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Company or Individual"
                  className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 shadow-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Start Date</label>
                <input 
                  type="date" 
                  required 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Target USD</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 transition-colors" />
                  <input 
                    type="number" 
                    required 
                    value={totalValueUSD}
                    onChange={(e) => setTotalValueUSD(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-10 text-slate-900 dark:text-white outline-none focus:border-primary/50 font-bold shadow-sm transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Rate</label>
                <input 
                  type="number" 
                  required 
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 shadow-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Total BDT</label>
                <div className="w-full bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-500 dark:text-gray-500 font-bold transition-all shadow-inner">
                  {(parseFloat(totalValueUSD || "0") * parseFloat(exchangeRate || "0")).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Team Assignments</label>
              <div className="p-3 bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl max-h-40 overflow-y-auto space-y-2 custom-scrollbar transition-all shadow-inner">
                {users.map((user) => (
                  <label key={user._id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={assignedTo.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) setAssignedTo([...assignedTo, user._id]);
                        else setAssignedTo(assignedTo.filter(id => id !== user._id));
                      }}
                      className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-white dark:bg-black text-primary accent-primary shadow-sm transition-all"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 shadow-sm transition-all">
                        {user.image ? (
                          <Image 
                            src={user.image} 
                            alt={user.name} 
                            width={32} 
                            height={32} 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-blue-600/40 flex items-center justify-center text-[10px] font-bold text-white transition-all uppercase">
                            {user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{user.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-tighter transition-colors">{user.role}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#252525] rounded-2xl text-sm font-semibold text-slate-400 dark:text-gray-400 transition-all shadow-sm">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group transition-all">
                {isSubmitting ? "Scaffolding Project..." : "Launch Project"}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
