"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, 
  Search, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  MoreVertical, 
  UserPlus,
  Mail,
  Lock,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useGlobalLoading } from "@/components/providers/LoadingProvider";
import { Modal } from "@/components/ui/Modal";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: "CO_FOUNDER" | "PROJECT_MANAGER" | "LEADER" | "EMPLOYEE";
  isActive: boolean;
}

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsContentLoading } = useGlobalLoading();
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsContentLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) { console.error(err); }
    finally { 
      setIsLoading(false); 
      setIsContentLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editingUser.role,
          isActive: editingUser.isActive
        }),
      });

      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) { console.error(err); }
    finally { setIsUpdating(false); }
  };

  if (session?.user?.role !== "CO_FOUNDER") {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-2 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-rose-600 dark:text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center transition-colors">Unauthorized Access</h2>
        <p className="text-slate-400 dark:text-gray-500 text-center max-w-md transition-colors">Only Co-Founders have permission to manage system users and role assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Member Directory</h1>
            <p className="text-slate-400 dark:text-gray-500 text-sm transition-colors duration-300">Oversee roles, access levels, and account statuses for the organization.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-primary/10 text-slate-400 dark:text-primary border border-slate-200 dark:border-primary/20 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed transition-all shadow-sm">
          <UserPlus className="w-4 h-4" /> Add New Member
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-none transition-all duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2 w-full max-w-md shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="w-4 h-4 text-slate-400 dark:text-gray-700" />
            <input type="text" placeholder="Search by name or email..." className="bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-700 outline-none w-full font-medium" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] transition-colors">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-colors">User Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Assigned Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Account Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-right transition-colors">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
              {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#1c1c1c] dark:to-[#141414] flex items-center justify-center text-primary font-bold border border-slate-200 dark:border-white/5 shadow-sm transition-all">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{u.name}</span>
                          <span className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1.5 transition-colors">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Shield className={cn(
                          "w-4 h-4 transition-colors",
                          u.role === "CO_FOUNDER" ? "text-primary" : "text-slate-400 dark:text-gray-600"
                        )} />
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors">
                          {u.role.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-sm",
                        u.isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-100 dark:border-rose-500/10"
                      )}>
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Suspended
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => setEditingUser(u)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} className="max-w-lg">
        {!editingUser ? null : (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Administrative Override</h2>
                <p className="text-slate-400 dark:text-gray-500 text-sm mt-1 transition-colors">Adjust permissions for {editingUser.name}.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full shadow-sm">✕</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">System Role</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                    className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-slate-900 dark:text-white outline-none focus:border-primary/50 appearance-none font-medium cursor-pointer transition-all shadow-sm"
                  >
                    <option value="CO_FOUNDER">Co-Founder (Admin)</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="LEADER">Team Leader</option>
                    <option value="EMPLOYEE">Standard Associate</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">Access Status</label>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setEditingUser({...editingUser, isActive: true})}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-sm",
                        editingUser.isActive ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500" : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 dark:text-gray-600"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingUser({...editingUser, isActive: false})}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-sm",
                        !editingUser.isActive ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-500" : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 dark:text-gray-600"
                      )}
                    >
                      <XCircle className="w-4 h-4" /> Suspended
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl flex gap-3 shadow-sm transition-all">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-500 shrink-0" />
                  <p className="text-[10px] text-slate-500 dark:text-gray-500 leading-relaxed font-bold uppercase tracking-tight transition-colors">
                    Security Warning: Updating a user's role will immediately revoke or grant permissions across all financial modules. This action is logged in the system audit trail.
                  </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 bg-slate-50 dark:bg-[#1c1c1c] hover:bg-slate-100 dark:hover:bg-[#252525] rounded-2xl text-sm font-semibold text-slate-400 dark:text-gray-400 transition-all shadow-sm">Discard</button>
                <button type="submit" disabled={isUpdating} className="flex-[2] py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group transition-all shadow-lg shadow-primary/20">
                  {isUpdating ? "Applying Changes..." : "Commit Override"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
