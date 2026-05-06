"use client";

import { useState } from "react";
import {
  ExternalLink, X, CheckCircle2, XCircle,
  TrendingUp, AlertTriangle, Sparkles, Loader2
} from "lucide-react";
import type { Job, UserProfile } from "@/types";
import MatchScoreRing from "./MatchScoreRing";
import TailorDialog from "./TailorDialog";

interface Props {
  job: Job;
  profile: UserProfile;
  onClose: () => void;
}

export default function JobDetailPanel({ job, profile, onClose }: Props) {
  const [showTailor, setShowTailor] = useState(false);
  const { matchScore } = job;

  return (
    <>
      <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-white leading-tight">{job.title}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{job.company} · {job.location}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Match Score Breakdown */}
          {matchScore && (
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200 text-sm">Match Analysis</h3>
                <MatchScoreRing score={matchScore.overall} size={72} />
              </div>

              {/* Breakdown bars */}
              <div className="space-y-2.5">
                {Object.entries(matchScore.breakdown).map(([key, val]) => (
                  <ScoreBar key={key} label={key} value={val} />
                ))}
              </div>

              {/* Strengths & Gaps */}
              <div className="mt-4 grid grid-cols-1 gap-3">
                {matchScore.strengths.length > 0 && (
                  <div>
                    <p className="text-xs text-emerald-400 font-medium mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Strengths
                    </p>
                    <ul className="space-y-1">
                      {matchScore.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {matchScore.gaps.length > 0 && (
                  <div>
                    <p className="text-xs text-orange-400 font-medium mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Gaps
                    </p>
                    <ul className="space-y-1">
                      {matchScore.gaps.map((g, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                          <XCircle className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Missing skills */}
              {matchScore.missingSkills.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-red-400 font-medium mb-1.5">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchScore.missingSkills.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-red-900/20 text-red-400 border border-red-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Job Description */}
          <div>
            <h3 className="font-semibold text-gray-200 text-sm mb-3">Job Description</h3>
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
              {job.description.slice(0, 1500)}{job.description.length > 1500 ? "..." : ""}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-200 text-sm mb-3">Requirements</h3>
              <ul className="space-y-1.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                    <span className="text-brand-400 mt-0.5">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button
            onClick={() => setShowTailor(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Tailor Resume
          </button>
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Apply
          </a>
        </div>
      </div>

      {showTailor && (
        <TailorDialog job={job} profile={profile} onClose={() => setShowTailor(false)} />
      )}
    </>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const colors: Record<string, string> = {
    skills: "bg-brand-500",
    experience: "bg-emerald-500",
    education: "bg-yellow-500",
    seniority: "bg-purple-500",
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 capitalize shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${colors[label] || "bg-brand-500"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{value}</span>
    </div>
  );
}
