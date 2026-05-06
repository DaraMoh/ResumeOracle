import type { Job, JobSearchParams, UserProfile } from "@/types";

// ──────────────────────────────────────────────
// JSearch via RapidAPI  (aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter)
// ──────────────────────────────────────────────
async function searchViaJSearch(params: JobSearchParams): Promise<Job[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey || apiKey === "your_rapidapi_key_here") return [];

  const query = params.query || "software engineer";
  const location = params.remoteOnly ? "remote" : (params.location || "United States");
  const page = params.page || 1;
  const numPages = Math.ceil((params.resultsPerPage || 15) / 10);

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", `${query} in ${location}`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("num_pages", String(numPages));
  url.searchParams.set("date_posted", "month");
  if (params.remoteOnly) url.searchParams.set("remote_jobs_only", "true");
  if (params.employmentType) url.searchParams.set("employment_types", params.employmentType.toUpperCase());

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });

  if (!res.ok) {
    console.error("JSearch error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data || []).map((j: any): Job => ({
    id: j.job_id,
    title: j.job_title,
    company: j.employer_name,
    location: j.job_city
      ? `${j.job_city}, ${j.job_state || j.job_country}`
      : (j.job_country || "Remote"),
    isRemote: j.job_is_remote || false,
    salary: (j.job_min_salary || j.job_max_salary)
      ? {
          min: j.job_min_salary ?? null,
          max: j.job_max_salary ?? null,
          currency: j.job_salary_currency || "USD",
          period: mapSalaryPeriod(j.job_salary_period),
        }
      : null,
    description: j.job_description || "",
    requirements: extractRequirements(j.job_description || ""),
    postedDate: j.job_posted_at_datetime_utc || new Date().toISOString(),
    applicationUrl: j.job_apply_link || j.job_google_link || "#",
    source: j.job_publisher || "JSearch",
    employmentType: j.job_employment_type || "FULLTIME",
  }));
}

// ──────────────────────────────────────────────
// Adzuna API  (free tier, great US/UK coverage)
// ──────────────────────────────────────────────
async function searchViaAdzuna(params: JobSearchParams): Promise<Job[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || "us";

  if (
    !appId || appId === "your_adzuna_app_id_here" ||
    !appKey || appKey === "your_adzuna_app_key_here"
  ) return [];

  const query = params.query || "software engineer";
  const page = params.page || 1;
  const resultsPerPage = params.resultsPerPage || 15;

  const url = new URL(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`
  );
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  url.searchParams.set("what", query);
  if (params.location && !params.remoteOnly) url.searchParams.set("where", params.location);
  if (params.remoteOnly) url.searchParams.set("what_and", "remote");
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("Adzuna error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results || []).map((j: any): Job => ({
    id: j.id,
    title: j.title,
    company: j.company?.display_name || "Unknown",
    location: j.location?.display_name || "Unknown",
    isRemote: j.title?.toLowerCase().includes("remote") || j.description?.toLowerCase().includes("remote") || false,
    salary: (j.salary_min || j.salary_max)
      ? {
          min: j.salary_min ?? null,
          max: j.salary_max ?? null,
          currency: "USD",
          period: "yearly",
        }
      : null,
    description: j.description || "",
    requirements: extractRequirements(j.description || ""),
    postedDate: j.created || new Date().toISOString(),
    applicationUrl: j.redirect_url || "#",
    source: "Adzuna",
    employmentType: "FULLTIME",
  }));
}

// ──────────────────────────────────────────────
// Main export: searches both APIs and deduplicates
// ──────────────────────────────────────────────
export async function searchJobs(params: JobSearchParams): Promise<Job[]> {
  const [jsearchResults, adzunaResults] = await Promise.allSettled([
    searchViaJSearch(params),
    searchViaAdzuna(params),
  ]);

  const jobs: Job[] = [];
  const seen = new Set<string>();

  const add = (list: Job[]) => {
    for (const job of list) {
      const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        jobs.push(job);
      }
    }
  };

  if (jsearchResults.status === "fulfilled") add(jsearchResults.value);
  if (adzunaResults.status === "fulfilled") add(adzunaResults.value);

  return jobs;
}

// ──────────────────────────────────────────────
// Build a smart query from user profile
// ──────────────────────────────────────────────
export function buildSearchQueryFromProfile(profile: UserProfile): string {
  const recentTitle = profile.experience[0]?.title || "";
  const topDomain = profile.stats.topDomains[0] || "";
  const topSkill = profile.skills.technical[0] || "";

  // Use recent job title as primary query, with domain context
  if (recentTitle) return recentTitle;
  if (topDomain && topSkill) return `${topSkill} ${topDomain}`;
  if (topSkill) return `${topSkill} developer`;
  return "software engineer";
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function extractRequirements(description: string): string[] {
  const lines = description.split(/\n|•|·|-|\*/);
  return lines
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 20 &&
        l.length < 300 &&
        /require|experience|profici|knowledge|skill|familiar|must|should/i.test(l)
    )
    .slice(0, 10);
}

function mapSalaryPeriod(period: string | undefined): "yearly" | "monthly" | "hourly" {
  if (!period) return "yearly";
  const p = period.toLowerCase();
  if (p.includes("hour") || p === "hour") return "hourly";
  if (p.includes("month") || p === "month") return "monthly";
  return "yearly";
}
