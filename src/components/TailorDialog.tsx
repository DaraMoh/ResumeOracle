"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { X, Sparkles, Loader2, Download, ChevronRight } from "lucide-react";
import type { Job, UserProfile, TailoredResume } from "@/types";

// Dynamically import the PDF component to avoid SSR issues
const ResumePDF = dynamic(() => import("./ResumePDF"), { ssr: false });

interface Props {
  job: Job;
  profile: UserProfile;
  onClose: () => void;
}

export default function TailorDialog({ job, profile, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TailoredResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleTailor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, job }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to tailor resume");
      setResult(data.tailored as TailoredResume);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setIsGeneratingPDF(true);

    try {
      // Dynamic import so the PDF renderer only loads client-side
      const { pdf } = await import("@react-pdf/renderer");
      const { default: ResumePDFDoc } = await import("./ResumePDF");
      const { createElement } = await import("react");
      type PdfRoot = Parameters<typeof pdf>[0];

      const blob = await pdf(
        createElement(ResumePDFDoc, { resume: result.structured }) as PdfRoot
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = result.structured.name.replace(/\s+/g, "_");
      const safeCompany = job.company.replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `${safeName}_${safeCompany}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("PDF generation failed. Try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Tailor Resume for {job.title}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!result && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-brand-900/50 border border-brand-700 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-gray-200 font-semibold text-lg mb-2">
                Gemini AI Resume Tailor
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                Gemini will rewrite your resume to highlight the most relevant
                experience for{" "}
                <span className="text-brand-300">{job.title}</span> at{" "}
                <span className="text-brand-300">{job.company}</span>, then
                generate a downloadable PDF.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6 text-xs text-gray-500">
                {[
                  "Highlights relevant experience",
                  "Adds job-specific keywords",
                  "Downloads as PDF",
                ].map((feat) => (
                  <div
                    key={feat}
                    className="bg-gray-800 rounded-xl p-3 flex items-start gap-2"
                  >
                    <ChevronRight className="w-3 h-3 text-brand-400 mt-0.5 shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>
              {error && (
                <p className="text-red-400 text-sm mb-4 bg-red-900/20 border border-red-800 rounded-lg p-3">
                  {error}
                </p>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
              <p className="text-gray-400">Tailoring your resume with AI...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Changes summary */}
              <div className="bg-brand-950 border border-brand-800 rounded-xl p-4">
                <p className="text-brand-300 font-medium text-sm mb-2">
                  Changes Made
                </p>
                <ul className="space-y-1">
                  {result.changes.map((c, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-400 flex items-start gap-2"
                    >
                      <span className="text-brand-400 mt-0.5">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
                {result.addedKeywords.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-900">
                    <p className="text-xs text-gray-500 mb-1.5">
                      Added keywords:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.addedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-xs px-2 py-0.5 rounded-md bg-brand-900/50 text-brand-300 border border-brand-800"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Structured preview */}
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 space-y-4 text-sm">
                {/* Name + contact */}
                <div>
                  <p className="text-white font-bold text-base">
                    {result.structured.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {[
                      result.structured.contact.email,
                      result.structured.contact.phone,
                      result.structured.contact.location,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </div>

                {/* Summary */}
                {result.structured.summary && (
                  <div>
                    <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
                      Summary
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      {result.structured.summary}
                    </p>
                  </div>
                )}

                {/* Experience preview (first 2) */}
                {result.structured.experience.length > 0 && (
                  <div>
                    <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
                      Experience
                    </p>
                    <div className="space-y-3">
                      {result.structured.experience.slice(0, 2).map((exp, i) => (
                        <div key={i}>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-200">
                              {exp.title}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {exp.dates}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mb-1">
                            {exp.company}
                          </p>
                          {exp.bullets.slice(0, 2).map((b, j) => (
                            <p
                              key={j}
                              className="text-gray-400 text-xs leading-relaxed"
                            >
                              • {b}
                            </p>
                          ))}
                        </div>
                      ))}
                      {result.structured.experience.length > 2 && (
                        <p className="text-gray-600 text-xs">
                          + {result.structured.experience.length - 2} more
                          roles in the PDF
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills preview */}
                {result.structured.skills.length > 0 && (
                  <div>
                    <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.structured.skills.slice(0, 10).map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700"
                        >
                          {s}
                        </span>
                      ))}
                      {result.structured.skills.length > 10 && (
                        <span className="text-xs text-gray-600">
                          +{result.structured.skills.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex gap-3">
          {!result ? (
            <button
              onClick={handleTailor}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Tailoring...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Tailored Resume
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Building PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download PDF
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
