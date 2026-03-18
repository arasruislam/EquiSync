"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setLocalError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setLocalError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-primary/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-[#141414] border border-white/5 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-8 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center">
            <Image 
              src="/logo.png" 
              alt="QuoteXStudio Logo" 
              width={64} 
              height={64} 
              className="mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
              priority
            />
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              QuoteXStudio
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Internal Management System</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {(localError || error) && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{localError || "Authentication failed. Please check your credentials."}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@quotexstudio.com"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-gray-400">Password</label>
                  <button type="button" className="text-xs text-primary hover:underline decoration-primary/30 underline-offset-4">
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse group-hover:scale-125 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-gray-500 text-sm">
                Protected by enterprise-grade security. 
                <br />
                Authorized personnel only.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-6 text-xs text-gray-600 uppercase tracking-[0.2em]">
          &copy; 2026 QuoteXStudio Operations
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
