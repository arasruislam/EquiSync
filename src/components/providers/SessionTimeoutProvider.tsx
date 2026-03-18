"use client";

import { useEffect, useState, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { AlertCircle, LogOut } from "lucide-react";

const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutes
const WARNING_BEFORE = 30 * 1000; // 30 seconds

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRemainingTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);
    setRemainingTime(30);

    if (status === "authenticated") {
      warningRef.current = setTimeout(() => {
        setShowWarning(true);
        startCountdown();
      }, TIMEOUT_DURATION - WARNING_BEFORE);

      timeoutRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, TIMEOUT_DURATION);
    }
  };

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    
    const activityHandler = () => {
      if (!showWarning) resetTimer();
    };

    if (status === "authenticated") {
      events.forEach((event) => window.addEventListener(event, activityHandler));
      resetTimer();
    }

    return () => {
      events.forEach((event) => window.removeEventListener(event, activityHandler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status, showWarning]);

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed bottom-8 right-8 z-[9999] animate-in slide-in-from-right-8 duration-500">
          <div className="bg-[#050B18] border border-blue-500/20 rounded-3xl p-6 shadow-2xl shadow-blue-900/40 max-w-sm backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 animate-pulse border border-blue-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Security Protocol</h4>
                  <p className="text-gray-400 text-[11px] leading-tight font-medium">
                    Your session is terminating due to inactivity. Protective redirection in <span className="text-blue-400 font-black">{remainingTime}s</span>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={resetTimer}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Resume Session
                  </button>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
