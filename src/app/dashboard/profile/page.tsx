"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile Form State
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || "");
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });

      const data = await res.json();
      if (res.ok) {
        await update({ name, image }); // NextAuth session update
        setMessage({ type: "success", text: "Profile identity updated successfully" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "A system error occurred" });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setIsPasswordLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Credentials updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "A security error occurred" });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Identity Management</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Secure Profile & Credential Matrix</p>
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 border",
          message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
        )}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr,320px] gap-8">
        <div className="space-y-8">
          {/* Main Identity Card */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-blue-600/10" />
            
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              General Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Email Identity (Immutable)</label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={session?.user?.email || ""} 
                    disabled 
                    className="w-full bg-[#111624]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-gray-500 font-bold text-sm cursor-not-allowed outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Shield size={14} className="text-gray-700" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Full Operator Name</label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="w-full bg-[#111624] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-gray-800"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProfileLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
              >
                {isProfileLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Synchronize Profile
                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security & Credentials Card */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-indigo-600/10" />

            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
              Credential Modification
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Current Verification Password</label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-indigo-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-[#111624] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">New Password</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-indigo-500 transition-colors">
                      <KeyRound size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-[#111624] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Confirm Matrix</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-indigo-500 transition-colors">
                      <KeyRound size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-[#111624] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isPasswordLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
              >
                {isPasswordLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Update Credentials
                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          {/* Avatar Upload Card */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-8 flex flex-col items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] w-full flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              Visual ID
            </h3>
            
            <AvatarUpload 
              currentImage={image} 
              onUploadSuccess={(url) => setImage(url)} 
            />

            <div className="w-full space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest block">System Role</span>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{session?.user?.role?.replace(/_/g, " ")}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest block">Access Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase">Authorized</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-blue-500">
              <Shield size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Security Protocol</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
              Updating your profile triggers a comprehensive audit trace. All modifications are logged with your unique operator ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
