import { Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="flex justify-center pt-20 animate-in fade-in duration-500">
      <div className="text-center w-full max-w-lg bg-[#0f0f0f] border border-white/5 p-12 rounded-3xl mt-12 shadow-[0_0_40px_rgba(244,63,94,0.05)]">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <Construction className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">Others Withdraw</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          The Others Withdraw module is currently under development. Data metrics and management features will be integrated soon.
        </p>
      </div>
    </div>
  );
}
