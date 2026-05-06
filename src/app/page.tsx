"use client";

import { useState } from "react";
import { Sparkles, Search, ArrowRight, FileText, Zap, Target } from "lucide-react";
import type { UserProfile } from "@/types";
import ResumeUpload from "@/components/ResumeUpload";
import UserProfileCard from "@/components/UserProfile";
import Link from "next/link";

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("resumeProfile");
    return stored ? (JSON.parse(stored) as UserProfile) : null;
  });

  const handleProfileReady = (p: UserProfile) => {
    setProfile(p);
    // Persist to sessionStorage so the jobs page can access it
    localStorage.setItem("resumeProfile", JSON.stringify(p));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-white text-lg">ResumeOracle</span>
          </div>
          {profile && (
            <Link
              href="/jobs"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
            >
              <Search className="w-4 h-4" />
              Find Jobs
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        {!profile ? (
          /* Landing / Upload */
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-950 border border-brand-800 text-brand-300 text-xs font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                Powered by Google Gemini AI
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                Find jobs you&apos;re{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
                  actually qualified for
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Upload your resume. Gemini analyzes your skills and experience,
                then searches LinkedIn, Indeed, and more to find your best matches.
              </p>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { icon: <FileText className="w-4 h-4" />, text: "AI Resume Analysis", sub: "Skills, experience & seniority" },
                { icon: <Target className="w-4 h-4" />, text: "Match Scoring", sub: "0-100 fit score per job" },
                { icon: <Sparkles className="w-4 h-4" />, text: "Resume Tailoring", sub: "Gemini rewrites for each role" },
              ].map((f) => (
                <div key={f.text} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-brand-400 flex justify-center mb-2">{f.icon}</div>
                  <p className="text-gray-200 text-sm font-medium">{f.text}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{f.sub}</p>
                </div>
              ))}
            </div>

            <ResumeUpload onSuccess={handleProfileReady} />
          </div>
        ) : (
          /* Profile view */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Your Profile</h2>
                <button
                  onClick={() => { setProfile(null); localStorage.removeItem("resumeProfile"); }}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Upload different resume
                </button>
              </div>
              <UserProfileCard profile={profile} />
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-200 mb-3">Ready to search?</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Your profile is built. Find jobs matched to your exact skills and experience level.
                  </p>
                  <Link
                    href="/jobs"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Search Jobs
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Quick stats */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-gray-200 text-sm">Profile Highlights</h3>
                  <div className="space-y-2">
                    <Row label="Seniority" value={profile.stats.seniorityLevel} />
                    <Row label="Total experience" value={`${profile.stats.totalYearsExperience} years`} />
                    <Row label="Professional exp." value={`${profile.stats.yearsExperienceExcludingInternships} years`} />
                    <Row label="Top skills" value={profile.skills.technical.slice(0, 3).join(", ")} />
                    <Row label="Domains" value={profile.stats.topDomains.slice(0, 2).join(", ")} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-300 text-xs text-right font-medium max-w-[60%]">{value}</span>
    </div>
  );
}
