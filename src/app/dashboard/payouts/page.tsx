"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  HandCoins,
  ArrowUpRight,
  Briefcase,
  Layers,
  Calendar,
  DollarSign
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

interface Payout {
  _id: string;
  recipient: { _id: string; name: string; role: string; image?: string };
  amountBDT: number;
  amountUSD: number;
  type: string;
  project?: { title: string };
  date: string;
  note?: string;
}

export default function PayoutsPage() {
  const { data: session } = useSession();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [recipientId, setRecipientId] = useState("");
  const [amountBDT, setAmountBDT] = useState("");
  const [type, setType] = useState("SALARY");
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayouts();
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/payouts");
      const data = await res.json();
      if (Array.isArray(data)) setPayouts(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch (err) { console.error(err); }
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bdt = parseFloat(amountBDT);
    const rate = 120; // Simplified for UI demonstration, should ideally be dynamic
    const usd = bdt / rate;

    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          amountBDT: bdt,
          amountUSD: usd,
          exchangeRate: rate,
          type,
          project: projectId || undefined,
          note,
          date,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setAmountBDT("");
        setNote("");
        fetchPayouts();
      }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-500 transition-colors">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Member Payouts</h1>
            <p className="text-slate-400 dark:text-gray-500 text-sm transition-colors duration-300">Disburse salaries, bonuses, and project revenue shares.</p>
          </div>
        </div>
        {session?.user?.role === "SUPER_ADMIN" && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Record Payout
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-blue-900/5 transition-all duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 w-full max-w-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="w-4 h-4 text-slate-400 dark:text-gray-700" />
            <input type="text" placeholder="Search by member or project..." className="bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-700 outline-none w-full font-medium" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Recipient</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Disbursement</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Operational Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                [1, 2, 3].map((i) => <tr key={i} className="animate-pulse h-16"><td colSpan={5} className="px-6 bg-slate-50/50 dark:bg-white/[0.01]" /></tr>)
              ) : payouts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-gray-500 italic">No payout records found.</td></tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-400 whitespace-nowrap text-center font-medium transition-colors">{formatDate(p.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-center">
                        {p.recipient?.image ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shrink-0">
                            <Image 
                              src={p.recipient.image} 
                              alt={p.recipient.name} 
                              width={32} 
                              height={32} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-blue-600/40 flex items-center justify-center text-[10px] font-bold text-white border border-slate-200 dark:border-white/10 shrink-0">
                            {p.recipient?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="flex flex-col items-start translate-x-[-2px]">
                          <div className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest leading-tight transition-colors">
                            {p.recipient?.name?.split(" ")[0]}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-tighter transition-colors">{p.recipient?.role?.replace("_", " ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase border border-blue-100 dark:border-blue-500/10 transition-all">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{formatCurrency(p.amountBDT, "BDT")}</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-600 font-bold transition-colors">~ {formatCurrency(p.amountUSD, "USD")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-widest transition-colors">
                        {p.project ? (
                          <>
                            <Briefcase className="w-3 h-3 text-blue-500" />
                            {p.project.title.substring(0, 15)}...
                          </>
                        ) : "—"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} className="max-w-lg">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Record Payout</h2>
            <p className="text-slate-400 dark:text-gray-500 text-sm mt-1 transition-colors">Disburse internal company funds.</p>
          </div>
          <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full">✕</button>
        </div>
        
        <form onSubmit={handleCreatePayout} className="p-8 space-y-5 bg-white dark:bg-[#0a0a0a]">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Recipient Member</label>
            <select 
              required
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 appearance-none font-medium cursor-pointer shadow-sm transition-all"
            >
              <option value="">Select Member</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Amount (BDT)</label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-500" />
                <input type="number" required value={amountBDT} onChange={(e) => setAmountBDT(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-10 text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 font-bold shadow-sm transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Payout Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 appearance-none font-medium transition-all shadow-sm">
                <option value="SALARY">Salary</option>
                <option value="BONUS">Bonus</option>
                <option value="COMMISSION">Commission</option>
                <option value="PROJECT_SHARE">Project Share</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Link to Project (Optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 appearance-none font-medium transition-all shadow-sm">
              <option value="">No Project Affiliation</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Reference Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Feb 2026 Salary or Performance Bonus" rows={2} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 resize-none shadow-sm transition-all" />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#252525] rounded-2xl text-sm font-semibold text-slate-400 dark:text-gray-400 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group transition-all shadow-lg shadow-indigo-500/20">
              {isSubmitting ? "Processing..." : "Confirm Payout"}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
