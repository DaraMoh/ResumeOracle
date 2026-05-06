export interface WorkExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | "Present";
  isInternship: boolean;
  durationMonths: number;
  description: string[];
  skills: string[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  graduationYear: number | null;
  gpa: string | null;
}

export interface UserProfile {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  experience: WorkExperience[];
  education: Education[];
  certifications: string[];
  stats: {
    totalYearsExperience: number;
    yearsExperienceExcludingInternships: number;
    totalCompanies: number;
    totalInternships: number;
    seniorityLevel: "Entry" | "Mid" | "Senior" | "Lead" | "Executive";
    topDomains: string[];
  };
  rawText: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
    period: "yearly" | "monthly" | "hourly";
  } | null;
  description: string;
  requirements: string[];
  postedDate: string;
  applicationUrl: string;
  source: string;
  employmentType: string;
  matchScore?: MatchScore;
}

export interface MatchScore {
  overall: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    seniority: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  remoteOnly?: boolean;
  experienceLevel?: string;
  employmentType?: string;
  page?: number;
  resultsPerPage?: number;
}

export interface TailoredResumeStructured {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: {
    title: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    dates: string;
    details?: string;
  }[];
  skills: string[];
  certifications?: string[];
}

export interface TailoredResume {
  structured: TailoredResumeStructured;
  changes: string[];
  addedKeywords: string[];
}
