import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="flex justify-center pt-20 animate-in fade-in duration-500 transition-colors">
      <div className="text-center w-full max-w-lg bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-white/5 p-12 rounded-[32px] mt-12 shadow-xl dark:shadow-none transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-500 mx-auto mb-6 shadow-sm transition-all">
          <Construction className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-3 transition-colors uppercase">OTHERS Projects</h1>
        <p className="text-slate-400 dark:text-gray-500 text-sm leading-relaxed transition-colors font-medium">
          The OTHERS Projects module is currently under development. Data metrics and management features will be integrated soon.
        </p>
      </div>
    </div>
  );
}
