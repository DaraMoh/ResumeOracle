"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface Props {
  onSuccess: (profile: UserProfile) => void;
}

export default function ResumeUpload({ onSuccess }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append("resume", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to parse resume");
        onSuccess(data.profile as UserProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        className={cn(
          "flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200",
          isDragging
            ? "border-brand-400 bg-brand-950/50 scale-[1.02]"
            : "border-gray-700 bg-gray-900/50 hover:border-brand-500 hover:bg-gray-800/50",
          isLoading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-3 px-6 text-center">
          {isLoading ? (
            <>
              <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
              <p className="text-gray-300 font-medium">Analyzing your resume with Gemini AI...</p>
              <p className="text-gray-500 text-sm">{fileName}</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-brand-900/50 border border-brand-700">
                <Upload className="w-7 h-7 text-brand-400" />
              </div>
              <div>
                <p className="text-gray-200 font-semibold text-lg">
                  Drop your resume here
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  or click to browse — PDF, DOCX, or TXT
                </p>
              </div>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && (
        <p className="mt-3 text-center text-gray-600 text-xs flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Your resume is processed locally and never stored
        </p>
      )}
    </div>
  );
}
