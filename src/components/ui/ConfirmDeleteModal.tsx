"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting = false
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0f0f0f] border border-rose-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
        
        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-3">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
