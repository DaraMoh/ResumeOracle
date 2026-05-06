import { NextRequest, NextResponse } from "next/server";
import { tailorResumeWithGemini } from "@/lib/gemini";
import type { UserProfile, Job } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { profile: UserProfile; job: Job };
    const { profile, job } = body;

    if (!profile || !job) {
      return NextResponse.json({ error: "profile and job are required" }, { status: 400 });
    }

    const tailored = await tailorResumeWithGemini(profile, job);
    return NextResponse.json({ tailored });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("tailor-resume error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
