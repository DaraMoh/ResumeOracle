import { NextRequest, NextResponse } from "next/server";
import { calculateMatchScoreWithGemini } from "@/lib/gemini";
import type { UserProfile, Job } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { profile: UserProfile; job: Job };
    const { profile, job } = body;

    if (!profile || !job) {
      return NextResponse.json({ error: "profile and job are required" }, { status: 400 });
    }

    const matchScore = await calculateMatchScoreWithGemini(profile, job);
    return NextResponse.json({ matchScore });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("match-score error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
