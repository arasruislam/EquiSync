"use client";

import { useState } from "react";
import { 
  Settings, 
  Bell, 
  Moon, 
  Lock, 
  Eye, 
  Monitor, 
  Globe, 
  Mail, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">System Settings</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Configuration Matrix v1.0.4</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px,1fr] gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {[
            { id: "general", label: "General", icon: Monitor },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "appearance", label: "Appearance", icon: Moon },
            { id: "security", label: "Security", icon: Lock },
            { id: "privacy", label: "Privacy", icon: Eye },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest",
                activeTab === item.id 
                  ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5" 
                  : "text-gray-500 hover:text-white hover:bg-white/[0.02] border border-transparent"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Theme Card */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              Interface Configuration
            </h3>

            <div className="space-y-4">
              <SettingItem 
                icon={Moon} 
                title="Dark Mode Engine" 
                desc="Optimize UI for low-light environments" 
                enabled={true} 
              />
              <SettingItem 
                icon={Monitor} 
                title="Glassmorphism FX" 
                desc="Enable dynamic backdrop blur filters" 
                enabled={true} 
              />
              <SettingItem 
                icon={Globe} 
                title="Auto-Sync Time" 
                desc="Synchronize system time with local GMT" 
                enabled={true} 
              />
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              Telemetry & Alerts
            </h3>

            <div className="space-y-4">
              <SettingItem 
                icon={Mail} 
                title="Email Dispatches" 
                desc="Receive financial summaries via email" 
                enabled={false} 
              />
              <SettingItem 
                icon={Bell} 
                title="Push Notifications" 
                desc="Desktop alerts for system events" 
                enabled={true} 
              />
              <SettingItem 
                icon={ShieldCheck} 
                title="Security Tracing" 
                desc="Log all mutation activities live" 
                enabled={true} 
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Enterprise Core Security</p>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter mt-0.5">Firmware Hash: 88AF-99X2-QQS1</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ icon: Icon, title, desc, enabled }: { icon: any, title: string, desc: string, enabled: boolean }) {
  const [isOn, setIsOn] = useState(enabled);

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#141414] border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-500/5 transition-all">
          <Icon size={18} />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-white uppercase tracking-wider">{title}</h4>
          <p className="text-[10px] text-gray-500 font-medium">{desc}</p>
        </div>
      </div>
      
      <button 
        onClick={() => setIsOn(!isOn)}
        className={cn(
          "w-10 h-5 rounded-full relative transition-all duration-300",
          isOn ? "bg-indigo-600" : "bg-[#1c1c1c] border border-white/10"
        )}
      >
        <div className={cn(
          "absolute top-1 w-3 h-3 rounded-full transition-all duration-300",
          isOn ? "left-6 bg-white" : "left-1 bg-gray-600"
        )} />
      </button>
    </div>
  );
}
