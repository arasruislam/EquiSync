"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showBlur?: boolean;
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  className,
  showBlur = true 
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center z-[9999] p-4 sm:p-6 overflow-hidden">
      {/* Backdrop Overlay - Absolute Full Viewport Coverage */}
      <div 
        className={cn(
          "fixed inset-0 w-screen h-screen bg-black/60 transition-all duration-300",
          showBlur && "backdrop-blur-sm"
        )} 
        onClick={onClose}
      />
      
      {/* Modal Content Wrapper */}
      <div className={cn(
        "relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]",
        className
      )}>
        {children}
      </div>
    </div>,
    document.body
  );
};
