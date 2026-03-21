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
import { formatCurrency, formatDate } from "@/lib/utils";
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
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white text-center">Unauthorized Access</h2>
        <p className="text-gray-500 text-center max-w-md">Only Co-Founders have permission to manage system users and role assignments.</p>
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
            <h1 className="text-2xl font-bold text-white">Member Directory</h1>
            <p className="text-gray-500 text-sm">Oversee roles, access levels, and account statuses for the organization.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed">
          <UserPlus className="w-4 h-4" /> Add New Member
        </button>
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3 bg-[#141414] border border-white/5 rounded-2xl px-4 py-2 w-full max-w-md">
            <Search className="w-4 h-4 text-gray-700" />
            <input type="text" placeholder="Search by name or email..." className="bg-transparent text-sm text-white placeholder:text-gray-700 outline-none w-full" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Assigned Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Account Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1c1c1c] to-[#141414] flex items-center justify-center text-primary font-bold border border-white/5">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{u.name}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Shield className={cn(
                          "w-4 h-4",
                          u.role === "CO_FOUNDER" ? "text-primary" : "text-gray-600"
                        )} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                          {u.role.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                        u.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
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
                        className="p-2 rounded-xl bg-white/5 text-gray-600 hover:text-white hover:bg-white/10 transition-all"
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
          <>
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Administrative Override</h2>
                <p className="text-gray-500 text-sm mt-1">Adjust permissions for {editingUser.name}.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">✕</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">System Role</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-2xl py-3 px-4 text-white outline-none focus:border-primary/50 appearance-none font-medium cursor-pointer"
                  >
                    <option value="CO_FOUNDER">Co-Founder (Admin)</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="LEADER">Team Leader</option>
                    <option value="EMPLOYEE">Standard Associate</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Access Status</label>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setEditingUser({...editingUser, isActive: true})}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest",
                        editingUser.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-white/5 border-white/5 text-gray-600"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingUser({...editingUser, isActive: false})}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest",
                        !editingUser.isActive ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-white/5 border-white/5 text-gray-600"
                      )}
                    >
                      <XCircle className="w-4 h-4" /> Suspended
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                  <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">
                    Security Warning: Updating a user's role will immediately revoke or grant permissions across all financial modules. This action is logged in the system audit trail.
                  </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 bg-[#1c1c1c] hover:bg-[#252525] rounded-2xl text-sm font-semibold text-gray-400">Discard</button>
                <button type="submit" disabled={isUpdating} className="flex-[2] py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group transition-all">
                  {isUpdating ? "Applying Changes..." : "Commit Override"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
