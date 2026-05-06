"use client";

import {
  User, MapPin, Mail, Phone, Briefcase, GraduationCap,
  Award, Code2, Wrench, Globe, TrendingUp, Building2
} from "lucide-react";
import type { UserProfile } from "@/types";
import SkillBadge from "./SkillBadge";

interface Props {
  profile: UserProfile;
}

export default function UserProfileCard({ profile }: Props) {
  const { stats, skills, experience, education, certifications } = profile;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-5 h-5 text-brand-400" />
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">{profile.summary}</p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </span>
              )}
              {profile.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {profile.phone}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-center px-4 py-3 bg-brand-950 border border-brand-800 rounded-xl">
            <div className="text-2xl font-bold text-brand-300">{stats.seniorityLevel}</div>
            <div className="text-xs text-gray-500 mt-0.5">Level</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          label="Total Experience"
          value={`${stats.totalYearsExperience} yrs`}
        />
        <StatCard
          icon={<Briefcase className="w-4 h-4 text-brand-400" />}
          label="Excl. Internships"
          value={`${stats.yearsExperienceExcludingInternships} yrs`}
        />
        <StatCard
          icon={<Building2 className="w-4 h-4 text-purple-400" />}
          label="Companies"
          value={String(stats.totalCompanies)}
        />
        <StatCard
          icon={<Award className="w-4 h-4 text-yellow-400" />}
          label="Internships"
          value={String(stats.totalInternships)}
        />
      </div>

      {/* Skills */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">Skills</h3>

        {skills.languages.length > 0 && (
          <SkillGroup
            icon={<Code2 className="w-4 h-4 text-cyan-400" />}
            label="Languages"
            skills={skills.languages}
            variant="lang"
          />
        )}
        {skills.technical.length > 0 && (
          <SkillGroup
            icon={<TrendingUp className="w-4 h-4 text-brand-400" />}
            label="Technical"
            skills={skills.technical}
            variant="tech"
          />
        )}
        {skills.tools.length > 0 && (
          <SkillGroup
            icon={<Wrench className="w-4 h-4 text-purple-400" />}
            label="Tools & Frameworks"
            skills={skills.tools}
            variant="tool"
          />
        )}
        {skills.soft.length > 0 && (
          <SkillGroup
            icon={<Globe className="w-4 h-4 text-gray-400" />}
            label="Soft Skills"
            skills={skills.soft}
            variant="default"
          />
        )}
      </div>

      {/* Experience */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-brand-400" /> Experience
        </h3>
        <div className="space-y-4">
          {experience.map((exp, i) => (
            <div key={i} className="relative pl-4 border-l border-gray-800">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-brand-600 border-2 border-gray-900" />
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div>
                  <span className="text-gray-100 font-medium text-sm">{exp.title}</span>
                  {exp.isInternship && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 border border-yellow-800">
                      Internship
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {exp.startDate} – {exp.endDate} · {liveDuration(exp.startDate, exp.endDate)}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-2">{exp.company}</p>
              {exp.description.slice(0, 2).map((d, j) => (
                <p key={j} className="text-gray-500 text-xs leading-relaxed">• {d}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      {education.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-400" /> Education
          </h3>
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i}>
                <p className="text-gray-200 text-sm font-medium">{edu.degree} in {edu.field}</p>
                <p className="text-gray-400 text-xs">{edu.institution}
                  {edu.graduationYear && ` · ${edu.graduationYear}`}
                  {edu.gpa && ` · GPA: ${edu.gpa}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" /> Certifications
          </h3>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-yellow-900/20 text-yellow-300 border border-yellow-800">
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function parseExpDate(dateStr: string): Date | null {
  // "YYYY-MM"
  const iso = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (iso) return new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, 1);
  // "Month YYYY" or "Jan 2026"
  const my = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (my) {
    const d = new Date(`${my[1]} 1, ${my[2]}`);
    if (!isNaN(d.getTime())) return d;
  }
  // "YYYY" fallback
  const y = dateStr.match(/^(\d{4})$/);
  if (y) return new Date(parseInt(y[1]), 0, 1);
  return null;
}

function liveDuration(startDate: string, endDate: string): string {
  const start = parseExpDate(startDate);
  const end = endDate === "Present" ? new Date() : parseExpDate(endDate);
  if (!start || !end) return endDate === "Present" ? "current" : "";
  const months = Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  );
  if (months < 12) return `${months} mo`;
  const years = months / 12;
  return `${Math.round(years * 10) / 10} yr${years >= 2 ? "s" : ""}`;
}

function SkillGroup({
  icon, label, skills, variant,
}: {
  icon: React.ReactNode;
  label: string;
  skills: string[];
  variant: "default" | "matched" | "missing" | "tech" | "tool" | "lang";
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <SkillBadge key={s} skill={s} variant={variant} />
        ))}
      </div>
    </div>
  );
}
