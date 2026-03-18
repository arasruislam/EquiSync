"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  Framer, 
  ArrowUpRight, 
  Briefcase, 
  Users, 
  Receipt, 
  History, 
  Settings, 
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
  Store,
  ChevronDown,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

type NavItem = {
  label: string;
  href?: string;
  icon?: any;
  roles: string[];
  haloShadow?: boolean;
  glowColor?: string;
  subItems?: { 
    label: string; 
    href?: string; 
    roles: string[];
    haloShadow?: boolean;
    glowColor?: string;
    subItems?: { label: string; href: string; roles: string[]; haloShadow?: boolean; glowColor?: string; }[];
  }[];
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"] },
  { label: "Investments", href: "/dashboard/investments", icon: Wallet, roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
  { 
    label: "Marketplaces", 
    icon: Store, 
    roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"],
    subItems: [
      { 
        label: "Fiverr", 
        roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"],
        subItems: [
          { label: "Income", href: "/dashboard/marketplace/fiverr/income", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"] },
          { label: "Withdraw", href: "/dashboard/marketplace/fiverr/withdrawals", roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
          { label: "Projects", href: "/dashboard/marketplace/fiverr/projects", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"] }
        ]
      },
      { 
        label: "Upwork", 
        roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"],
        subItems: [
          { label: "Income", href: "/dashboard/marketplace/upwork/income", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"] },
          { label: "Withdraw", href: "/dashboard/marketplace/upwork/withdraw", roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
          { label: "Projects", href: "/dashboard/marketplace/upwork/projects", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"] }
        ]
      },
      { 
        label: "B2B", 
        roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"],
        subItems: [
          { label: "Income", href: "/dashboard/marketplace/b2b/income", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"] },
          { label: "Withdraw", href: "/dashboard/marketplace/b2b/withdraw", roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
          { label: "Projects", href: "/dashboard/marketplace/b2b/projects", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"] }
        ]
      },
      { 
        label: "Local", 
        roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"],
        subItems: [
          { label: "Income", href: "/dashboard/marketplace/local/income", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"] },
          { label: "Withdraw", href: "/dashboard/marketplace/local/withdraw", roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
          { label: "Projects", href: "/dashboard/marketplace/local/projects", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"] }
        ]
      },
      { 
        label: "Others", 
        roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"],
        subItems: [
          { label: "Income", href: "/dashboard/marketplace/others/income", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"] },
          { label: "Withdraw", href: "/dashboard/marketplace/others/withdraw", roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
          { label: "Projects", href: "/dashboard/marketplace/others/projects", roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"] }
        ]
      },
    ]
  },
  { label: "Projects", href: "/dashboard/projects", icon: Briefcase, roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"] },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt, roles: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER"] },
  { label: "Member Payouts", href: "/dashboard/payouts", icon: Users, roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
  { label: "Ledger", href: "/dashboard/ledger", icon: History, roles: ["SUPER_ADMIN", "CO_FOUNDER", "LEADER"] },
  { label: "System Audit", href: "/dashboard/activity", icon: ShieldCheck, roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["SUPER_ADMIN", "CO_FOUNDER", "LEADER"] },
  { label: "User MGMT", href: "/dashboard/users", icon: Settings, roles: ["SUPER_ADMIN", "CO_FOUNDER"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Marketplaces": true
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const filteredItems = navItems.filter((item) => 
    item.roles.includes(session?.user?.role || "EMPLOYEE")
  );

  return (
    <aside 
      className={cn(
        "h-screen sticky top-0 bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 flex flex-col z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-3 shrink-0">
            <Image 
              src="/logo.png" 
              alt="QuoteXStudio Logo" 
              width={28} 
              height={28} 
              className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" 
            />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              QuoteXStudio
            </span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {filteredItems.map((item) => {
          
          if (item.subItems) {
            const hasActiveChild = item.subItems.some(sub => sub.href && pathname ? pathname.startsWith(sub.href) : false);
            const isOpen = openGroups[item.label] || false;
            
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    toggleGroup(item.label);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                    hasActiveChild ? "bg-white/5 text-white" : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3 relative">
                    <div className={cn(
                      "transition-all duration-300 rounded-lg p-1 relative z-10",
                      item.haloShadow && "bg-white/[0.02] border border-white/[0.05]"
                    )}>
                      {item.glowColor && (
                        <div className={cn("absolute inset-0 rounded-lg blur-md opacity-20", item.glowColor.replace('text-', 'bg-'))} />
                      )}
                      <item.icon className={cn("w-5 h-5 shrink-0 transition-all", hasActiveChild ? "text-primary/70" : item.glowColor || "group-hover:text-white")} />
                    </div>
                    {!collapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={cn("w-4 h-4 transition-transform text-white/30", isOpen && "rotate-180")} />
                  )}
                </button>
                
                {isOpen && !collapsed && (
                  <div className="ml-[1.35rem] pl-4 border-l border-white/10 space-y-1 mt-1">
                    {item.subItems.map(subItem => {
                      if (!subItem.roles.includes(session?.user?.role || "EMPLOYEE")) return null;
                      
                      const active = pathname === subItem.href;
                      const isSubOpen = openGroups[subItem.label] || false;
                      const hasActiveDeepChild = subItem.subItems?.some(deep => deep.href && pathname ? pathname.startsWith(deep.href) : false);

                      if (subItem.subItems) {
                        return (
                          <div key={subItem.label} className="mt-2 space-y-1">
                            <button
                              onClick={() => toggleGroup(subItem.label)}
                              className={cn(
                                "w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all group",
                                hasActiveDeepChild ? "text-white font-medium" : "text-gray-400 hover:text-white"
                              )}
                            >
                              <span className="text-xs uppercase tracking-wider font-bold">{subItem.label}</span>
                              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform text-gray-500", isSubOpen && "rotate-180")} />
                            </button>
                            
                            {isSubOpen && (
                              <div className="pl-3 space-y-0.5 border-l border-white/5 ml-1">
                                {subItem.subItems.map(deepItem => {
                                  if (!deepItem.roles.includes(session?.user?.role || "EMPLOYEE")) return null;
                                  const active = pathname === deepItem.href;
                                  return (
                                    <Link
                                      key={deepItem.href}
                                      href={deepItem.href}
                                      className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all relative group text-sm",
                                        active 
                                          ? "bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] border border-primary/20" 
                                          : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                                      )}
                                    >
                                      <span className="truncate">{deepItem.label}</span>
                                      {active && (
                                        <div className="absolute left-[-13px] w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)]" />
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

 
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href!}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative group",
                            active 
                              ? "bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] border border-primary/20" 
                              : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                          )}
                        >
                          <span className="font-medium text-sm truncate">{subItem.label}</span>
                          {active && (
                            <div className="absolute left-[-17px] w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = pathname === item.href;
          return (
            <Link
              key={item.href!}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                active 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <div className={cn(
                "transition-all duration-300 rounded-lg p-1 relative z-10",
                item.haloShadow && "bg-white/[0.02] border border-white/[0.05]"
              )}>
                {(item as any).glowColor && (
                  <div className={cn("absolute inset-0 rounded-lg blur-md opacity-20", (item as any).glowColor.replace('text-', 'bg-'))} />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0 transition-all", active ? "text-primary" : (item as any).glowColor || "group-hover:text-white")} />
              </div>
              {!collapsed && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
              {active && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
