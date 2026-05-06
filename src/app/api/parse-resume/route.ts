import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/resumeParser";
import { parseResumeWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(buffer, file.type);

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: "Could not extract text from file. Please try a different format." },
        { status: 400 }
      );
    }

    const profile = await parseResumeWithGemini(text);
    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("parse-resume error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
