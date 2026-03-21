"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Bell, Search, PlusCircle, User, CheckCircle2, ChevronRight, X, LogOut, Settings, UserCircle, Sun, Moon } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useSocket } from "@/components/providers/SocketProvider";
import { useTheme } from "next-themes";

export default function TopBar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    // Close dropdowns on click outside
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside both dropdowns
      const notificationDropdown = document.getElementById("notification-dropdown");
      const profileDropdown = document.getElementById("profile-dropdown");
      const notificationBell = document.getElementById("notification-bell");
      const profileTrigger = document.getElementById("profile-trigger");

      if (notificationDropdown && !notificationDropdown.contains(event.target as Node) &&
          notificationBell && !notificationBell.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileDropdown && !profileDropdown.contains(event.target as Node) &&
          profileTrigger && !profileTrigger.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => fetchNotifications();
    socket.on("new-notification", handleNewNotification);
    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects, transactions, or users..." 
            className="w-full bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-white/5 rounded-full py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {session?.user?.role === "CO_FOUNDER" && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <span>Company Balance: {formatCurrency(45230, "USD")}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-90"
          title="Toggle Theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-500 animate-in zoom-in duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500 animate-in zoom-in duration-300" />
          )}
        </button>

        <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/5 mx-1" />

        {/* Notification Bell */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button 
            id="notification-bell"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a]" />
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotifDropdown && (
            <div id="notification-dropdown" className="absolute top-full mt-3 right-0 w-80 sm:w-96 bg-white dark:bg-[#0B101B] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                <h3 className="text-[10px] font-black text-slate-900 dark:text-white tracking-[0.2em] uppercase">Security Notifications <span className="ml-1 text-primary">({unreadCount})</span></h3>
                {unreadCount > 0 && (
                  <button onClick={() => handleMarkAsRead("all")} className="text-[9px] font-black text-gray-500 hover:text-primary transition-colors uppercase tracking-widest">Clear All</button>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-400 dark:text-gray-600 italic font-medium">No system traces detected.</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {notifications.map((n) => (
                      <div key={n._id} className={`p-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors relative group ${!n.isRead ? "bg-primary/[0.03]" : ""}`}>
                        {!n.isRead && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full" />}
                        <div className="flex gap-4">
                          <div className={`mt-0.5 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${n.type === "FINANCE" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : n.type === "SYSTEM" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed tracking-tight ${!n.isRead ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-gray-400 font-medium"}`}>
                              {n.message}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              {n.url && (
                                <Link 
                                  href={n.url} 
                                  onClick={() => {
                                    if(!n.isRead) handleMarkAsRead(n._id);
                                    setShowNotifDropdown(false);
                                  }}
                                  className="text-[10px] text-blue-500 font-black hover:text-gray-900 dark:hover:text-white transition-colors flex items-center uppercase tracking-widest"
                                >
                                  Trace <ChevronRight className="w-3 h-3 ml-1" />
                                </Link>
                              )}
                              <span className="text-[9px] text-slate-400 dark:text-gray-700 font-black uppercase tracking-widest">{formatDate(n.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-white/5 mx-1" />

        {/* Profile Avatar & Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div 
            id="profile-trigger"
            className="flex items-center gap-3 pl-2 group cursor-pointer active:scale-95 transition-transform"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{session?.user?.name?.split(" ")[0]}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-tighter font-black">{session?.user?.role?.replace("_", " ")}</span>
            </div>
            <div className="relative shrink-0">
              {session?.user?.image ? (
                <div className={cn(
                  "w-10 h-10 rounded-full overflow-hidden border-2 shadow-lg dark:shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:shadow-blue-500/20 dark:group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:border-blue-500 transition-all duration-500",
                  showProfileDropdown ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-200 dark:border-blue-900"
                )}>
                  <Image 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    width={40} 
                    height={40} 
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#111624] border-2 border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-gray-500 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0B101B] rounded-full shadow-md dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div id="profile-dropdown" className="absolute top-full mt-3 right-0 w-64 bg-white dark:bg-[#0B101B] border border-slate-200 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate mb-0.5">{session?.user?.name}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-500 font-bold uppercase tracking-widest">{session?.user?.role?.replace(/_/g, " ")}</p>
              </div>
              
              <div className="p-2">
                <Link 
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all group/item"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover/item:bg-blue-500/10 group-hover/item:text-blue-500 transition-colors">
                    <UserCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">My Profile</span>
                </Link>
                
                <Link 
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all group/item"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover/item:bg-indigo-500/10 group-hover/item:text-indigo-500 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
                </Link>

                <div className="h-[1px] bg-gray-100 dark:bg-white/5 my-2 mx-4" />

                <button 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 transition-all group/logout"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/5 flex items-center justify-center group-hover/logout:bg-rose-500/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Terminate Session</span>
                </button>
              </div>
              
              <div className="px-6 py-3 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 dark:text-gray-700 uppercase tracking-widest">QuoteX Matrix v1.0</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
