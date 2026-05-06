"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, SlidersHorizontal, Sparkles, ArrowLeft,
  Loader2, MapPin, Wifi, RefreshCw, AlertCircle, ChevronDown
} from "lucide-react";
import Link from "next/link";
import type { Job, UserProfile, JobSearchParams } from "@/types";
import JobCard from "@/components/JobCard";
import JobDetailPanel from "@/components/JobDetailPanel";

export default function JobsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isScoringAll, setIsScoringAll] = useState(false);
  const [scoringJobId, setScoringJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    location: string;
    remoteOnly: boolean;
    employmentType: string;
  }>({ location: "", remoteOnly: false, employmentType: "" });

  // Load profile from sessionStorage
  useEffect(() => {
    const stored = localStorage.getItem("resumeProfile");
    if (stored) {
      const p = JSON.parse(stored) as UserProfile;
      setProfile(p);
    }
  }, []);

  const doSearch = useCallback(
    async (customQuery?: string) => {
      setIsSearching(true);
      setError(null);
      setJobs([]);
      setSelectedJob(null);

      const params: JobSearchParams = {
        query: customQuery || searchQuery || undefined,
        location: filters.location || undefined,
        remoteOnly: filters.remoteOnly,
        employmentType: filters.employmentType || undefined,
        resultsPerPage: 20,
      };

      try {
        const res = await fetch("/api/search-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, params }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");

        setJobs(data.jobs as Job[]);
        setActiveQuery(data.query as string);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [profile, searchQuery, filters]
  );

  // Auto-search when profile loads
  useEffect(() => {
    if (profile && jobs.length === 0) doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const scoreJob = useCallback(
    async (job: Job): Promise<Job> => {
      if (job.matchScore || !profile) return job;
      setScoringJobId(job.id);

      try {
        const res = await fetch("/api/match-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, job }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const scored: Job = { ...job, matchScore: data.matchScore };
        setJobs((prev) => prev.map((j) => (j.id === job.id ? scored : j)));
        if (selectedJob?.id === job.id) setSelectedJob(scored);
        return scored;
      } catch {
        return job;
      } finally {
        setScoringJobId(null);
      }
    },
    [profile, selectedJob]
  );

  const handleJobSelect = useCallback(
    async (job: Job) => {
      setSelectedJob(job);
      if (!job.matchScore) {
        const scored = await scoreJob(job);
        setSelectedJob(scored);
      }
    },
    [scoreJob]
  );

  const scoreAllJobs = useCallback(async () => {
    if (!profile || isScoringAll) return;
    setIsScoringAll(true);

    const unscored = jobs.filter((j) => !j.matchScore);
    for (const job of unscored) {
      await scoreJob(job);
    }
    setIsScoringAll(false);
  }, [jobs, profile, isScoringAll, scoreJob]);

  const sortedJobs = [...jobs].sort((a, b) => {
    if (a.matchScore && b.matchScore) return b.matchScore.overall - a.matchScore.overall;
    if (a.matchScore) return -1;
    if (b.matchScore) return 1;
    return 0;
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm shrink-0 z-40">
        <div className="max-w-full px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="font-bold text-white hidden sm:block">ResumeOracle</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder={
                  profile
                    ? `Search jobs (auto: "${activeQuery || "loading..."}")`
                    : "Search jobs..."
                }
                className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <button
              onClick={() => doSearch()}
              disabled={isSearching}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shrink-0"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`px-3 py-2 rounded-xl text-sm border transition-colors shrink-0 ${
                showFilters ? "bg-brand-900 border-brand-700 text-brand-300" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Score all button */}
          {jobs.length > 0 && profile && (
            <button
              onClick={scoreAllJobs}
              disabled={isScoringAll || jobs.every((j) => !!j.matchScore)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 hover:border-brand-600 text-gray-400 hover:text-brand-300 text-xs font-medium transition-colors disabled:opacity-40 shrink-0"
            >
              {isScoringAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Score All
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-3 flex flex-wrap gap-3 border-t border-gray-800 pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <input
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                placeholder="Location (e.g. New York)"
                className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-brand-500 w-44"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.remoteOnly}
                onChange={(e) => setFilters((f) => ({ ...f, remoteOnly: e.target.checked }))}
                className="rounded border-gray-600"
              />
              <Wifi className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-400">Remote only</span>
            </label>
            <div className="flex items-center gap-2">
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={filters.employmentType}
                onChange={(e) => setFilters((f) => ({ ...f, employmentType: e.target.value }))}
                className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500"
              >
                <option value="">All types</option>
                <option value="FULLTIME">Full-time</option>
                <option value="PARTTIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Internship</option>
              </select>
            </div>
          </div>
        )}
      </nav>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Job list */}
        <div className={`${selectedJob ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[480px] xl:w-[520px] shrink-0 border-r border-gray-800 overflow-hidden`}>
          {/* List header */}
          <div className="px-4 py-3 border-b border-gray-800 shrink-0">
            {isSearching ? (
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching across job boards...
              </p>
            ) : error ? (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                {jobs.length > 0 ? (
                  <>
                    <span className="text-gray-300 font-medium">{jobs.length}</span> jobs for{" "}
                    <span className="text-brand-400">&ldquo;{activeQuery}&rdquo;</span>
                    {jobs.some((j) => j.matchScore) && (
                      <span className="ml-1 text-gray-600">· sorted by match score</span>
                    )}
                  </>
                ) : profile ? (
                  "Ready to search"
                ) : (
                  <Link href="/" className="text-brand-400 hover:underline">Upload your resume first</Link>
                )}
              </p>
            )}
          </div>

          {/* Job cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sortedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={handleJobSelect}
                isSelected={selectedJob?.id === job.id}
                isScoring={scoringJobId === job.id}
              />
            ))}
            {!isSearching && jobs.length === 0 && !error && (
              <div className="text-center py-20 text-gray-600">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No jobs yet. Search above to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className={`${selectedJob ? "flex" : "hidden lg:flex"} flex-1 overflow-hidden`}>
          {selectedJob && profile ? (
            <div className="flex-1 overflow-hidden">
              <JobDetailPanel
                job={selectedJob}
                profile={profile}
                onClose={() => setSelectedJob(null)}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-700">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg">Select a job to see details</p>
                <p className="text-sm mt-1 opacity-60">Click any job card to view the match analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
