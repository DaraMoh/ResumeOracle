import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UserProfile, MatchScore, Job, TailoredResume } from "@/types";

// ── Gemini fallback chain ──────────────────────────────────────────────────
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
];

// ── OpenRouter fallback chain (used when all Gemini models are quota-hit) ──
// Gemma 4 models first, then openrouter/auto which finds any available free model
const OPENROUTER_MODELS = [
  "openrouter/google/gemma-4-26b-a4b-it:free",
  "openrouter/google/gemma-4-31b-it:free",
  "openrouter/free",
];

// ── Helpers ────────────────────────────────────────────────────────────────
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }
  return new GoogleGenerativeAI(apiKey);
}

function parseRetryDelay(error: unknown): number | null {
  const msg = error instanceof Error ? error.message : String(error);
  const match =
    msg.match(/retryDelay['":\s]+(\d+)s/) ||
    msg.match(/retry in (\d+(?:\.\d+)?)s/i) ||
    msg.match(/(\d+)s/);
  if (match) return Math.min(parseInt(match[1], 10) * 1000, 65_000);
  return null;
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("rate limit")
  );
}

// ── OpenRouter call ────────────────────────────────────────────────────────
async function generateWithOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    throw new Error("OPENROUTER_API_KEY not configured — all Gemini models quota-hit");
  }

  let lastError: unknown;

  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`[OpenRouter] Trying ${model}...`);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "ResumeOracle",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${errBody}`);
      }

      const data = await res.json() as {
        choices: { message: { content: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("OpenRouter returned empty content");

      console.log(`[OpenRouter] Success with ${model}`);
      return text;
    } catch (err) {
      lastError = err;
      if (!isQuotaError(err)) {
        // Model not found or hard error — try next model
        console.warn(`[OpenRouter] ${model} failed: ${err instanceof Error ? err.message : err}`);
        continue;
      }
      console.warn(`[OpenRouter] ${model} quota hit, trying next...`);
    }
  }

  throw lastError ?? new Error("All OpenRouter models failed");
}

// ── Main entry point ───────────────────────────────────────────────────────
async function generateWithFallback(prompt: string): Promise<string> {
  const genAI = getGeminiClient();
  let geminiAllQuotaHit = true;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      if (!isQuotaError(err)) {
        geminiAllQuotaHit = false;
        throw err; // real error — don't fall through to OpenRouter
      }
      console.warn(`[Gemini] ${modelName} quota hit. Trying next...`);
    }
  }

  if (geminiAllQuotaHit) {
    console.warn("[Gemini] All models quota-hit. Falling back to OpenRouter...");
    return generateWithOpenRouter(prompt);
  }

  throw new Error("Unexpected: Gemini fallback loop exited without result");
}

export async function parseResumeWithGemini(resumeText: string): Promise<UserProfile> {
  const prompt = `You are an expert resume parser. Analyze the following resume text and extract structured information.

For work experience, carefully determine:
- Whether each role is an internship (look for "intern", "internship", "co-op", "coop" in title or description)
- Duration in months based on start/end dates
- Total years of professional experience INCLUDING internships
- Total years of professional experience EXCLUDING internships

Determine seniority level based on total non-internship years:
- Entry: 0-2 years
- Mid: 2-5 years
- Senior: 5-10 years
- Lead: 8+ years with leadership responsibilities
- Executive: VP, Director, C-suite

Return ONLY a valid JSON object matching this exact structure (no markdown, no explanation):
{
  "name": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "summary": "2-3 sentence professional summary",
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"],
    "languages": ["programming languages"],
    "tools": ["tools, frameworks, platforms"]
  },
  "experience": [
    {
      "title": "string",
      "company": "string",
      "startDate": "YYYY-MM or Month YYYY",
      "endDate": "YYYY-MM or Month YYYY or Present",
      "isInternship": true/false,
      "durationMonths": number,
      "description": ["bullet points"],
      "skills": ["skills used in this role"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "graduationYear": number or null,
      "gpa": "string or null"
    }
  ],
  "certifications": ["array of certifications"],
  "stats": {
    "totalYearsExperience": number,
    "yearsExperienceExcludingInternships": number,
    "totalCompanies": number,
    "totalInternships": number,
    "seniorityLevel": "Entry|Mid|Senior|Lead|Executive",
    "topDomains": ["top 3-5 domains/industries the person works in"]
  }
}

Resume text:
${resumeText}`;

  const text = await generateWithFallback(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini did not return valid JSON for resume parsing");

  const parsed = JSON.parse(jsonMatch[0]) as Omit<UserProfile, "rawText">;
  return { ...parsed, rawText: resumeText };
}

export async function calculateMatchScoreWithGemini(
  profile: UserProfile,
  job: Job
): Promise<MatchScore> {
  const profileSummary = `
Name: ${profile.name}
Seniority: ${profile.stats.seniorityLevel}
Total Experience: ${profile.stats.totalYearsExperience} years (${profile.stats.yearsExperienceExcludingInternships} years excl. internships)
Technical Skills: ${profile.skills.technical.join(", ")}
Tools: ${profile.skills.tools.join(", ")}
Languages: ${profile.skills.languages.join(", ")}
Top Domains: ${profile.stats.topDomains.join(", ")}
Education: ${profile.education.map((e) => `${e.degree} in ${e.field} from ${e.institution}`).join("; ")}
Recent Roles: ${profile.experience
    .slice(0, 3)
    .map((e) => `${e.title} at ${e.company}`)
    .join(", ")}
`;

  const prompt = `You are an expert job matching system. Score how well this candidate matches the job.

CANDIDATE PROFILE:
${profileSummary}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

Score each dimension 0-100 and return ONLY valid JSON (no markdown):
{
  "overall": number (0-100, weighted average),
  "breakdown": {
    "skills": number (0-100, how well technical skills match),
    "experience": number (0-100, years and relevance of experience),
    "education": number (0-100, education requirements match),
    "seniority": number (0-100, seniority level match)
  },
  "matchedSkills": ["skills the candidate has that the job wants"],
  "missingSkills": ["important skills the job wants that candidate lacks"],
  "strengths": ["2-3 specific strengths for this role"],
  "gaps": ["1-3 key gaps or concerns"]
}

Weight overall score: skills 40%, experience 35%, seniority 15%, education 10%.`;

  const text = await generateWithFallback(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini did not return valid JSON for match scoring");

  return JSON.parse(jsonMatch[0]) as MatchScore;
}

export async function tailorResumeWithGemini(
  profile: UserProfile,
  job: Job
): Promise<TailoredResume> {
  const prompt = `You are an expert resume writer and career coach. Rewrite the provided resume to better match the target job posting.

RULES:
1. Keep ALL factual information (dates, companies, titles, degrees) exactly as-is — never fabricate experience
2. Reorder bullet points to highlight most relevant experience first
3. Incorporate keywords from the job description naturally into existing bullet points
4. Strengthen action verbs and quantify impact where possible
5. Adjust the summary to speak directly to this role
6. Do NOT add fake experience, skills, or achievements

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

ORIGINAL RESUME:
${profile.rawText}

Return ONLY valid JSON (no markdown code blocks) with this exact structure:
{
  "structured": {
    "name": "candidate full name",
    "contact": {
      "email": "email or omit",
      "phone": "phone or omit",
      "location": "city, state or omit",
      "linkedin": "linkedin URL or omit",
      "website": "personal site or omit"
    },
    "summary": "2-3 sentence tailored professional summary",
    "experience": [
      {
        "title": "job title",
        "company": "company name",
        "dates": "Month YYYY – Month YYYY",
        "bullets": ["rewritten bullet 1", "bullet 2"]
      }
    ],
    "education": [
      {
        "degree": "Degree, Field",
        "institution": "University Name",
        "dates": "YYYY – YYYY",
        "details": "GPA, honors, or omit"
      }
    ],
    "skills": ["skill1", "skill2"],
    "certifications": ["cert1"]
  },
  "changes": ["3-6 specific changes made to tailor this resume"],
  "addedKeywords": ["keywords from the job description that were incorporated"]
}`;

  const text = await generateWithFallback(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini did not return valid JSON for resume tailoring");

  return JSON.parse(jsonMatch[0]) as TailoredResume;
}
