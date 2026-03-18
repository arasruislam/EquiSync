"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface LoadingContextType {
  isInitialLoading: boolean;
  isContentLoading: boolean;
  setIsContentLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);

  // Sync with NextAuth session status for Tier 1 (Initial Splash)
  useEffect(() => {
    if (status === "loading") {
      setIsInitialLoading(true);
    } else {
      // Small delay for smooth exit transition
      const timer = setTimeout(() => setIsInitialLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <LoadingContext.Provider value={{ 
      isInitialLoading, 
      isContentLoading, 
      setIsContentLoading 
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useGlobalLoading must be used within a LoadingProvider");
  }
  return context;
}
