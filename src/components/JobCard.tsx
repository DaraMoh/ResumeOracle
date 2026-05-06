"use client";

import { MapPin, Clock, ExternalLink, Building2, DollarSign, Wifi } from "lucide-react";
import { formatSalary, timeAgo } from "@/lib/utils";
import type { Job } from "@/types";
import MatchScoreRing from "./MatchScoreRing";

interface Props {
  job: Job;
  onSelect: (job: Job) => void;
  isSelected?: boolean;
  isScoring?: boolean;
}

export default function JobCard({ job, onSelect, isSelected, isScoring }: Props) {
  const { matchScore } = job;

  return (
    <div
      onClick={() => onSelect(job)}
      className={`
        relative bg-gray-900 border rounded-2xl p-5 cursor-pointer transition-all duration-200
        hover:border-brand-600 hover:bg-gray-850 group
        ${isSelected ? "border-brand-500 ring-1 ring-brand-500/30" : "border-gray-800"}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title + company */}
          <h3 className="text-gray-100 font-semibold text-base leading-tight group-hover:text-brand-300 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
            {job.isRemote && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3 h-3" /> Remote
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(job.postedDate)}
            </span>
            {job.salary && (
              <span className="flex items-center gap-1 text-emerald-400">
                <DollarSign className="w-3 h-3" />
                {formatSalary(job.salary.min, job.salary.max, job.salary.currency, job.salary.period)}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
              {job.source}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
              {job.employmentType.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Match score */}
        <div className="shrink-0">
          {isScoring ? (
            <div className="w-[80px] h-[80px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : matchScore ? (
            <MatchScoreRing score={matchScore.overall} size={80} />
          ) : (
            <div className="w-[80px] h-[80px] flex items-center justify-center text-gray-700 text-xs text-center">
              Click to score
            </div>
          )}
        </div>
      </div>

      {/* Matched skills preview */}
      {matchScore && matchScore.matchedSkills.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex flex-wrap gap-1.5">
            {matchScore.matchedSkills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-0.5 rounded-md bg-emerald-900/30 text-emerald-400 border border-emerald-800"
              >
                {s}
              </span>
            ))}
            {matchScore.matchedSkills.length > 5 && (
              <span className="text-xs text-gray-600">+{matchScore.matchedSkills.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Apply link */}
      <a
        href={job.applicationUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-gray-800 hover:bg-brand-700 text-gray-400 hover:text-white"
        title="Apply now"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
