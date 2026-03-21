"use client";

import Image from "next/image";
import { Camera, Loader2, User, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface AvatarUploadProps {
  currentImage?: string;
  onUploadSuccess: (url: string) => void;
}

export const AvatarUpload = ({ currentImage, onUploadSuccess }: AvatarUploadProps) => {
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Frontend validation
    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        onUploadSuccess(data.url);
        // Instant revalidation across the dashboard
        await update({ image: data.url }); 
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError("Network error during upload");
      console.error(err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group/avatar">
        <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
        
        <div className={cn(
          "w-32 h-32 rounded-full overflow-hidden border-4 border-[#0a0a0a] ring-4 ring-blue-500/20 shadow-2xl relative z-10 transition-transform duration-500",
          !isLoading && "group-hover/avatar:scale-105"
        )}>
          {isLoading ? (
            <div className="w-full h-full bg-[#111624] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : currentImage ? (
            <Image 
              src={currentImage} 
              alt="Avatar" 
              width={128} 
              height={128} 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-[#111624] flex items-center justify-center text-gray-500">
              <User size={48} />
            </div>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading}
        />

        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-full border-4 border-[#0a0a0a] text-white shadow-lg hover:bg-blue-500 transition-colors z-20 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
          title="Upload Photo"
        >
          {isLoading ? (
             <Loader2 size={16} className="animate-spin" />
          ) : (
            <Camera size={16} className="group-hover/btn:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 text-rose-500 animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle size={12} />
          <span className="text-[9px] font-black uppercase tracking-widest">{error}</span>
        </div>
      ) : (
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Max size: 2MB • 1:1 Aspect Ratio</p>
      )}
    </div>
  );
};
