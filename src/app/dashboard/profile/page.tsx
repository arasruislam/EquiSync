"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { User, Mail, Shield, Calendar, MapPin, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex flex-col items-center p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden">
          {/* Cover Placeholder */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-900/20 to-indigo-900/20" />
          
          <div className="relative mt-8 group/avatar">
            <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
            {session?.user?.image ? (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#0a0a0a] ring-4 ring-blue-500/20 shadow-2xl relative z-10 transition-transform duration-500 group-hover/avatar:scale-105">
                <Image 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  width={128} 
                  height={128} 
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#111624] border-4 border-[#0a0a0a] ring-4 ring-white/5 flex items-center justify-center text-gray-400 relative z-10">
                <User size={48} />
              </div>
            )}
            <button className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-full border-4 border-[#0a0a0a] text-white shadow-lg hover:bg-blue-500 transition-colors z-20">
              <Edit3 size={16} />
            </button>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">{session?.user?.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                {session?.user?.role?.replace(/_/g, " ")}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Member</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10 max-w-2xl px-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Security</span>
              <span className="text-xs font-bold text-white uppercase">2FA Enabled</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Joined</span>
              <span className="text-xs font-bold text-white uppercase">Jan 2024</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">HQ Access</span>
              <span className="text-xs font-bold text-white uppercase">Authorized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact info */}
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            Contact Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Mail size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Email Address</span>
                <span className="text-sm font-bold text-white">{session?.user?.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Shield size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest">System UID</span>
                <span className="text-sm font-mono font-bold text-gray-400">{session?.user?.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Permissions */}
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            Active Permissions
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "View Financials",
              "Manage Projects",
              "Audit Telemetry",
              "Access Ledger",
              "Execute Payouts",
              "Modify Users"
            ].map((perm, i) => (
              <span 
                key={i}
                className="px-4 py-2 rounded-xl bg-[#141414] border border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:border-indigo-500/50 hover:text-white transition-all cursor-default"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
