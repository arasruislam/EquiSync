"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Briefcase,
  ChevronRight,
  TrendingDown,
  Calendar,
  DollarSign,
  Tag,
  Building,
  Trash2,
  Edit2,
  Lock
} from "lucide-react";
import dynamic from "next/dynamic";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
const ConfirmDeleteModal = dynamic(() => import("@/components/ui/ConfirmDeleteModal").then(mod => mod.ConfirmDeleteModal), { ssr: false });
import { useSocket } from "@/components/providers/SocketProvider";
import { fetchLiveExchangeRate } from "@/lib/exchange-rate";
import { Modal } from "@/components/ui/Modal";

interface IContribution {
  coOwner: {
    _id: string;
    name: string;
    email: string;
  };
  amountUSD: number;
  amountBDT: number;
  paidAmountBDT?: number;
  paidAmountUSD?: number;
  status: "PENDING" | "CLEARED";
}

interface Expense {
  _id: string;
  category: string;
  amountBDT: number;
  amountUSD: number;
  description: string;
  vendor?: string;
  date: string;
  project?: { _id: string, title: string };
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Static Co-Founders for Checklist
  const coFounders = [
    { id: "650000000000000000000001", name: "Rahul Roy Nipon" }, // Replaced in effect
    { id: "650000000000000000000002", name: "Ashraful Islam" },
    { id: "650000000000000000000003", name: "Saifur Rahman" },
  ];

  // Dynamic state loaded from DB
  const [dbCoFounders, setDbCoFounders] = useState<{_id: string, name: string}[]>([]);

  // Form State
  const [category, setCategory] = useState("SOFTWARE");
  const [amountBDT, setAmountBDT] = useState("");
  const [exchangeRate, setExchangeRate] = useState("120");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchExpenses();
    fetchProjects();
    fetchCoFounders();
    fetchLiveExchangeRate().then(rate => setExchangeRate(rate.toString()));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleInvalidate = () => fetchExpenses();
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

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch (err) { console.error(err); }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rate = parseFloat(exchangeRate) || 120;
    const totalBDT = parseFloat(amountBDT);

    if (isNaN(totalBDT) || totalBDT <= 0) {
      alert("Please enter a valid expense amount in BDT.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amountBDT: totalBDT,
          exchangeRate: rate,
          description,
          vendor,
          project: projectId || undefined,
          date,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setAmountBDT("");
        setDescription("");
        setVendor("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create expense");
      }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const openEditForm = (exp: Expense) => {
    setEditingExpenseId(exp._id);
    setCategory(exp.category);
    setAmountBDT(exp.amountBDT.toString());
    setDescription(exp.description);
    setVendor(exp.vendor || "");
    setProjectId(exp.project?._id || "");
    setDate(exp.date.split("T")[0]);
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingExpenseId(null);
    setCategory("SOFTWARE");
    setAmountBDT("");
    setDescription("");
    setVendor("");
    setProjectId("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpenseId) return;
    setIsSubmitting(true);

    const rate = parseFloat(exchangeRate) || 120;
    const totalBDT = parseFloat(amountBDT);

    if (isNaN(totalBDT) || totalBDT <= 0) {
      alert("Please enter a valid expense amount in BDT.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${editingExpenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amountBDT: totalBDT,
          exchangeRate: rate,
          description,
          vendor,
          project: projectId || null,
          date,
        }),
      });

      if (res.ok) {
        closeEditForm();
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update expense");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/expenses/${itemToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setItemToDelete(null);
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete expense");
      }
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Business Expenses</h1>
            <p className="text-slate-400 dark:text-gray-500 text-sm transition-colors duration-300">Track operational costs, software licenses, and office overheads.</p>
          </div>
        </div>
        {["SUPER_ADMIN"].includes(session?.user?.role || "") && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#050B18] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl dark:shadow-lg dark:shadow-blue-900/5 transition-all duration-500">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 w-full max-w-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="w-4 h-4 text-slate-400 dark:text-gray-500" />
            <input type="text" placeholder="Search expenses or vendors..." className="bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-700 outline-none w-full" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Description</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Net Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Attribution</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                [1, 2, 3].map((i) => <tr key={i} className="animate-pulse h-16"><td colSpan={6} className="px-6 bg-white/[0.01]" /></tr>)
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No expense records found.</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-400 whitespace-nowrap text-center font-medium capitalize">{formatDate(e.date)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 text-[9px] font-black tracking-widest uppercase bg-blue-500/5 px-2.5 py-1.5 rounded-lg border border-blue-500/10 shadow-sm">
                          <Tag className="w-3 h-3 text-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400">{e.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors text-center">{e.description}</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-tight text-center">{e.vendor || "Direct Outflow"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest text-center">{formatCurrency(e.amountBDT, "BDT")}</span>
                        <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold text-center mt-0.5">~ {formatCurrency(e.amountUSD, "USD")}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-widest">
                        {e.project ? (
                          <>
                            <Briefcase className="w-3 h-3 text-blue-500" />
                            {e.project.title.substring(0, 15)}...
                          </>
                        ) : (
                          <>
                            <Building className="w-3 h-3 text-blue-900/50" />
                            Operational
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {session?.user?.role === "SUPER_ADMIN" && (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={(evt) => {
                              evt.stopPropagation();
                              openEditForm(e);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(evt) => {
                              evt.stopPropagation();
                              setItemToDelete(e._id as string);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-500 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} className="max-w-lg">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Record Expense</h2>
            <p className="text-slate-400 dark:text-gray-500 text-sm mt-1">Operational disbursement tracking.</p>
          </div>
          <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full">✕</button>
        </div>
        
        <form onSubmit={handleCreateExpense} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 appearance-none font-medium transition-all"
              >
                <option value="SOFTWARE">Software / SaaS</option>
                <option value="TOOLS">Hardware / Tools</option>
                <option value="MARKETING">Ads / Marketing</option>
                <option value="OFFICE">Office / Utilities</option>
                <option value="FREELANCER">External Freelancer</option>
                <option value="MISC">Miscellaneous</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Vendor (Optional)</label>
              <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. AWS, Adobe, etc." className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Brief Description</label>
            <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Monthly hosting for client X" className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Total Expense Amount (BDT)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-bold text-sm">৳</span>
              <input 
                type="number" 
                required 
                value={amountBDT}
                onChange={(e) => setAmountBDT(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-rose-500/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/5 transition-all text-lg font-mono text-center tracking-wider"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Directly deducted from the unified Company Capital Pool.</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Exchange Rate (USD)</label>
              <input type="number" required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 text-center font-mono transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Incurred Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 text-center uppercase tracking-wider text-sm transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Project Attribution (Optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 appearance-none font-medium text-center transition-all">
              <option value="">Operational Overhead</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#252525] rounded-2xl text-sm font-semibold text-slate-500 dark:text-gray-400 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group transition-all">
              {isSubmitting ? "Saving..." : "Record Expense"}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditForm} onClose={closeEditForm} className="max-w-lg">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-500" /> Edit Record & Recalculate
            </h2>
            <p className="text-slate-400 dark:text-gray-500 text-sm mt-1">Operational disbursement editing.</p>
          </div>
          <button onClick={closeEditForm} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full">✕</button>
        </div>
        
        <form onSubmit={handleEditExpense} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Type</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 appearance-none font-medium text-center transition-all">
                <option value="SOFTWARE">Software / API</option>
                <option value="MARKETING">Marketing</option>
                <option value="LEGAL">Legal / Govt</option>
                <option value="DEVICE">Hardware / Asset</option>
                <option value="OTHER">Other Config</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 text-center uppercase tracking-wider text-sm transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center justify-between ml-1">
              <span>Total Amount (BDT)</span>
              {amountBDT && (
                <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  ≈ ${(parseFloat(amountBDT) / (parseFloat(exchangeRate) || 120)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-gray-500 font-mono">৳</span>
              <input type="number" step="0.01" required value={amountBDT} onChange={(e) => setAmountBDT(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl focus:border-rose-500/50 text-slate-900 dark:text-white font-mono outline-none text-center tracking-wider transition-all" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Reason</label>
              <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 text-center transition-all" placeholder="e.g. Server Renewal" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Vendor (Opt)</label>
              <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 text-center transition-all" placeholder="e.g. AWS" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Project Attribution (Optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-rose-500/50 appearance-none font-medium text-center transition-all">
              <option value="">Operational Overhead</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={closeEditForm} className="flex-1 py-4 bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#252525] rounded-2xl text-sm font-semibold text-slate-500 dark:text-gray-400 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group transition-all">
              {isSubmitting ? "Updating..." : "Update Expense"}
              <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense Record"
        description="Are you absolutely sure you want to permanently delete this corporate expense? This action cannot be undone and will restore the deducted capital back into the Company Balance."
        isDeleting={isDeleting}
      />
    </div>
  );
}
