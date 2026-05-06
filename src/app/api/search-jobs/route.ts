import { NextRequest, NextResponse } from "next/server";
import { searchJobs, buildSearchQueryFromProfile } from "@/lib/jobSearch";
import type { UserProfile, JobSearchParams } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      profile?: UserProfile;
      params?: JobSearchParams;
    };

    const { profile, params = {} } = body;

    // Auto-build query from profile if none provided
    if (!params.query && profile) {
      const { buildSearchQueryFromProfile: build } = await import("@/lib/jobSearch");
      params.query = build(profile);
    }

    const searchParams: JobSearchParams = {
      query: params.query || "software engineer",
      location: params.location,
      remoteOnly: params.remoteOnly ?? false,
      employmentType: params.employmentType,
      page: params.page ?? 1,
      resultsPerPage: params.resultsPerPage ?? 15,
    };

    const jobs = await searchJobs(searchParams);
    return NextResponse.json({ jobs, query: searchParams.query });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("search-jobs error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
