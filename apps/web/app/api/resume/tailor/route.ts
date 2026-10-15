import { NextResponse } from "next/server";
import { z } from "zod";
import { tailorResume } from "@/lib/agents/resume_tailor_agent";
import { saveTailoredResume } from "@/lib/resume/save-tailored-resume";

const requestSchema = z.object({
  jobDescription: z.string().trim().min(50).max(30_000),
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

    const result = await tailorResume(parsed.data.jobDescription);
    const savedFile = await saveTailoredResume(
      result.tailoredResume,
      result.companyName,
      result.jobTitle,
    );

    return NextResponse.json({ ...result, ...savedFile });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to tailor the resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
