import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { runResumeTailorWorkflow } from "@/lib/workflow/resume_tailor";
import {
  isChatModelId,
  MODEL_SELECTION_DEFAULTS,
} from "@/lib/llm/catalog";

const requestSchema = z.object({
  jobDescription: z.string().trim().min(50).max(30_000),
  resumeTailoringModelId: z.string().optional(),
  coverLetterModelId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Paste a job description with at least 50 characters before tailoring.",
        },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const savedResumeModel = cookieStore.get("aoe-resume-model")?.value;
    const savedCoverLetterModel = cookieStore.get("aoe-cover-letter-model")?.value;
    const resumeTailoringModelId =
      parsed.data.resumeTailoringModelId ?? savedResumeModel ?? MODEL_SELECTION_DEFAULTS.resumeTailoring;
    const coverLetterModelId =
      parsed.data.coverLetterModelId ?? savedCoverLetterModel ?? MODEL_SELECTION_DEFAULTS.coverLetter;

    if (!isChatModelId(resumeTailoringModelId) || !isChatModelId(coverLetterModelId)) {
      return NextResponse.json(
        { error: "One or more selected AI models are not available." },
        { status: 400 },
      );
    }

    const result = await runResumeTailorWorkflow(parsed.data.jobDescription, {
      resumeTailoring: resumeTailoringModelId,
      coverLetter: coverLetterModelId,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to tailor the resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
